import prismaClientPkg from "@prisma/client";
import type { UnitType as UnitTypeType } from "@prisma/client";
import type { z } from "zod";
import { ApiError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import { unitCreateSchema, unitUpdateSchema } from "./units.schemas.js";

const { Prisma, UnitType } = prismaClientPkg;

type UnitCreateInput = z.infer<typeof unitCreateSchema>;
type UnitUpdateInput = z.infer<typeof unitUpdateSchema>;

const toPrismaDecimal = (value?: number) => (typeof value === "number" ? new Prisma.Decimal(value) : undefined);

const ensureBuildingExists = async (buildingId: string) => {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building) {
    throw new ApiError(400, "buildingId must reference an existing building");
  }
};

const ensureContractExists = async (contractId: string) => {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) {
    throw new ApiError(400, "contractId must reference an existing contract");
  }
};

export const listUnits = (query: {
  buildingId?: string;
  type?: string;
  floor?: string;
  entrance?: string;
}) => {
  const parsedFloor = query.floor ? Number(query.floor) : undefined;
  return prisma.unit.findMany({
    where: {
      buildingId: query.buildingId,
      type: query.type ? (query.type as UnitTypeType) : undefined,
      floor: Number.isFinite(parsedFloor) ? parsedFloor : undefined,
      entrance: query.entrance ? { contains: query.entrance, mode: "insensitive" } : undefined,
    },
    include: {
      contract: true,
      building: {
        include: {
          property: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const createUnit = async (data: UnitCreateInput) => {
  await ensureBuildingExists(data.buildingId);
  if (data.contractId) {
    await ensureContractExists(data.contractId);
  }

  return prisma.unit.create({
    data: {
      ...data,
      size: toPrismaDecimal(data.size),
      coOwnershipShare: toPrismaDecimal(data.coOwnershipShare),
    },
    include: {
      contract: true,
      building: {
        include: {
          property: true,
        },
      },
    },
  });
};

export const getUnitById = async (id: string) => {
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      contract: true,
      building: {
        include: {
          property: true,
        },
      },
    },
  });
  if (!unit) {
    throw new ApiError(404, "Unit not found");
  }
  return unit;
};

export const updateUnitById = async (id: string, data: UnitUpdateInput) => {
  await getUnitById(id);

  if (data.buildingId) {
    await ensureBuildingExists(data.buildingId);
  }
  if (data.contractId) {
    await ensureContractExists(data.contractId);
  }

  return prisma.unit.update({
    where: { id },
    data: {
      ...data,
      size: toPrismaDecimal(data.size),
      coOwnershipShare: toPrismaDecimal(data.coOwnershipShare),
    },
    include: {
      contract: true,
      building: {
        include: {
          property: true,
        },
      },
    },
  });
};

export const deleteUnitById = async (id: string) => {
  await getUnitById(id);
  return prisma.unit.delete({ where: { id } });
};
