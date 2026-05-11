import type { z } from "zod";
import { ApiError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import { assignExistingContractSchema, createAndAssignContractSchema } from "./contracts.schemas.js";

type AssignExistingContractInput = z.infer<typeof assignExistingContractSchema>;
type CreateAndAssignContractInput = z.infer<typeof createAndAssignContractSchema>;

const includeUnitRelations = {
  contract: true,
  building: {
    include: {
      property: true,
    },
  },
} as const;

export const listContracts = () => {
  return prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
  });
};

const ensureUnitExists = async (unitId: string) => {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    throw new ApiError(404, "Unit not found");
  }
};

export const removeUnitContract = async (unitId: string) => {
  await ensureUnitExists(unitId);

  return prisma.unit.update({
    where: { id: unitId },
    data: { contractId: null },
    include: includeUnitRelations,
  });
};

export const assignExistingContractToUnit = async (unitId: string, data: AssignExistingContractInput) => {
  await ensureUnitExists(unitId);

  const contract = await prisma.contract.findUnique({ where: { id: data.contractId } });
  if (!contract) {
    throw new ApiError(400, "contractId must reference an existing contract");
  }

  return prisma.unit.update({
    where: { id: unitId },
    data: { contractId: data.contractId },
    include: includeUnitRelations,
  });
};

export const createAndAssignContractToUnit = async (unitId: string, data: CreateAndAssignContractInput) => {
  await ensureUnitExists(unitId);

  const contract = await prisma.contract.create({
    data: {
      name: data.name,
    },
  });

  return prisma.unit.update({
    where: { id: unitId },
    data: { contractId: contract.id },
    include: includeUnitRelations,
  });
};
