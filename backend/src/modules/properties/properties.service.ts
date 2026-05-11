import prismaClientPkg from "@prisma/client";
import type { Prisma, PropertyType as PropertyTypeType } from "@prisma/client";
import type { z } from "zod";
import { ApiError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import { propertyCreateSchema, propertyUpdateSchema } from "./properties.schemas.js";

const { PropertyType } = prismaClientPkg;

type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;

const ensurePropertyRelations = async (managerId: string, accountantId: string) => {
  const [manager, accountant] = await Promise.all([
    prisma.manager.findUnique({ where: { id: managerId } }),
    prisma.accountant.findUnique({ where: { id: accountantId } }),
  ]);

  if (!manager) {
    throw new ApiError(400, "managerId must reference an existing manager");
  }

  if (!accountant) {
    throw new ApiError(400, "accountantId must reference an existing accountant");
  }
};

export const listProperties = async (query: {
  type?: string;
  managerId?: string;
  accountantId?: string;
  search?: string;
}) => {
  const where: Prisma.PropertyWhereInput = {};

  if (query.type && Object.values(PropertyType).includes(query.type as PropertyTypeType)) {
    where.type = query.type as PropertyTypeType;
  }
  if (query.managerId) where.managerId = query.managerId;
  if (query.accountantId) where.accountantId = query.accountantId;
  if (query.search?.trim()) {
    where.name = { contains: query.search, mode: "insensitive" };
  }

  const properties = await prisma.property.findMany({
    where,
    include: {
      buildings: {
        select: {
          id: true,
          units: {
            select: {
              contractId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return properties.map((property) => {
    const buildingIds = property.buildings.map((building) => building.id);
    const unitsCount = property.buildings.reduce((sum, building) => sum + building.units.length, 0);
    const rentedUnitsCount = property.buildings.reduce(
      (sum, building) => sum + building.units.filter((unit) => unit.contractId !== null).length,
      0,
    );

    return {
      id: property.id,
      name: property.name,
      type: property.type,
      buildingIds,
      unitsCount,
      rentedUnitsCount,
    };
  });
};

export const createProperty = async (data: PropertyCreateInput) => {
  await ensurePropertyRelations(data.managerId, data.accountantId);

  return prisma.property.create({
    data: {
      name: data.name,
      type: data.type,
      managerId: data.managerId,
      accountantId: data.accountantId,
      buildings: data.buildings?.length
        ? {
            create: data.buildings,
          }
        : undefined,
    },
    include: {
      manager: true,
      accountant: true,
      buildings: true,
    },
  });
};

export const getPropertyById = async (id: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      manager: true,
      accountant: true,
      buildings: {
        include: { _count: { select: { units: true } } },
      },
    },
  });
  if (!property) {
    throw new ApiError(404, "Property not found");
  }
  return property;
};

export const updatePropertyById = async (id: string, data: PropertyUpdateInput) => {
  await getPropertyById(id);

  if (data.managerId || data.accountantId) {
    const current = await prisma.property.findUnique({ where: { id } });
    if (!current) {
      throw new ApiError(404, "Property not found");
    }

    await ensurePropertyRelations(data.managerId ?? current.managerId, data.accountantId ?? current.accountantId);
  }

  return prisma.property.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      managerId: data.managerId,
      accountantId: data.accountantId,
      buildings: data.buildings?.length
        ? {
            create: data.buildings,
          }
        : undefined,
    },
    include: {
      manager: true,
      accountant: true,
      buildings: true,
    },
  });
};

export const deletePropertyById = async (id: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: { _count: { select: { buildings: true } } },
  });

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  if (property._count.buildings > 0) {
    throw new ApiError(409, "Property has buildings and cannot be deleted");
  }

  return prisma.property.delete({ where: { id } });
};
