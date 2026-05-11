import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { ApiError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import { addUnitsSchema, buildingCreateSchema, buildingUpdateSchema } from "./buildings.schemas.js";

type BuildingCreateInput = z.infer<typeof buildingCreateSchema>;
type BuildingUpdateInput = z.infer<typeof buildingUpdateSchema>;
type AddUnitsInput = z.infer<typeof addUnitsSchema>;

const toPrismaDecimal = (value?: number) => (typeof value === "number" ? new Prisma.Decimal(value) : undefined);

const ensurePropertyExists = async (propertyId: string) => {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    throw new ApiError(400, "propertyId must reference an existing property");
  }
};

export const listBuildings = (query: { propertyId?: string; street?: string }) => {
  const where: Prisma.BuildingWhereInput = {};
  if (query.propertyId) where.propertyId = query.propertyId;
  if (query.street?.trim()) {
    where.street = { contains: query.street, mode: "insensitive" };
  }

  return prisma.building.findMany({
    where,
    include: {
      property: true,
      _count: { select: { units: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const createBuilding = async (data: BuildingCreateInput) => {
  await ensurePropertyExists(data.propertyId);

  return prisma.building.create({
    data: {
      propertyId: data.propertyId,
      street: data.street,
      houseNumber: data.houseNumber,
      floors: data.floors,
      maxApartments: data.maxApartments,
      entrances: data.entrances,
      description: data.description,
      units: data.units?.length
        ? {
            create: data.units.map((unit) => ({
              ...unit,
              size: toPrismaDecimal(unit.size),
              coOwnershipShare: toPrismaDecimal(unit.coOwnershipShare),
            })),
          }
        : undefined,
    },
    include: {
      property: true,
      units: true,
    },
  });
};

export const getBuildingById = async (id: string) => {
  const building = await prisma.building.findUnique({
    where: { id },
    include: {
      property: true,
      units: true,
    },
  });
  if (!building) {
    throw new ApiError(404, "Building not found");
  }
  return building;
};

export const updateBuildingById = async (id: string, data: BuildingUpdateInput) => {
  await getBuildingById(id);

  if (data.propertyId) {
    await ensurePropertyExists(data.propertyId);
  }

  return prisma.building.update({
    where: { id },
    data: {
      propertyId: data.propertyId,
      street: data.street,
      houseNumber: data.houseNumber,
      floors: data.floors,
      maxApartments: data.maxApartments,
      entrances: data.entrances,
      description: data.description,
      units: data.units?.length
        ? {
            create: data.units.map((unit) => ({
              ...unit,
              size: toPrismaDecimal(unit.size),
              coOwnershipShare: toPrismaDecimal(unit.coOwnershipShare),
            })),
          }
        : undefined,
    },
    include: {
      property: true,
      units: true,
    },
  });
};

export const addUnitsToBuildingById = async (id: string, data: AddUnitsInput) => {
  await getBuildingById(id);

  return prisma.building.update({
    where: { id },
    data: {
      units: {
        create: data.units.map((unit) => ({
          ...unit,
          size: toPrismaDecimal(unit.size),
          coOwnershipShare: toPrismaDecimal(unit.coOwnershipShare),
        })),
      },
    },
    include: {
      property: true,
      units: true,
    },
  });
};

export const deleteBuildingById = async (id: string) => {
  const building = await prisma.building.findUnique({
    where: { id },
    include: { _count: { select: { units: true } } },
  });

  if (!building) {
    throw new ApiError(404, "Building not found");
  }

  if (building._count.units > 0) {
    throw new ApiError(409, "Building has units and cannot be deleted");
  }

  return prisma.building.delete({ where: { id } });
};
