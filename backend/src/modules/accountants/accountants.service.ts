import type { z } from "zod";
import { ApiError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import { accountantCreateSchema, accountantUpdateSchema } from "./accountants.schemas.js";

type AccountantCreateInput = z.infer<typeof accountantCreateSchema>;
type AccountantUpdateInput = z.infer<typeof accountantUpdateSchema>;

export const listAccountants = () => prisma.accountant.findMany({ orderBy: { createdAt: "desc" } });

export const createAccountant = (data: AccountantCreateInput) => prisma.accountant.create({ data });

export const getAccountantById = async (id: string) => {
  const accountant = await prisma.accountant.findUnique({ where: { id } });
  if (!accountant) {
    throw new ApiError(404, "Accountant not found");
  }
  return accountant;
};

export const updateAccountantById = async (id: string, data: AccountantUpdateInput) => {
  await getAccountantById(id);
  return prisma.accountant.update({ where: { id }, data });
};

export const deleteAccountantById = async (id: string) => {
  await getAccountantById(id);
  try {
    return await prisma.accountant.delete({ where: { id } });
  } catch {
    throw new ApiError(409, "Accountant is referenced by properties and cannot be deleted");
  }
};
