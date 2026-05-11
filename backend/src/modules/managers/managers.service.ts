import { ApiError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import type { z } from "zod";
import { managerCreateSchema, managerUpdateSchema } from "./managers.schemas.js";

type ManagerCreateInput = z.infer<typeof managerCreateSchema>;
type ManagerUpdateInput = z.infer<typeof managerUpdateSchema>;

export const listManagers = () => prisma.manager.findMany({ orderBy: { createdAt: "desc" } });

export const createManager = (data: ManagerCreateInput) => prisma.manager.create({ data });

export const getManagerById = async (id: string) => {
  const manager = await prisma.manager.findUnique({ where: { id } });
  if (!manager) {
    throw new ApiError(404, "Manager not found");
  }
  return manager;
};

export const updateManagerById = async (id: string, data: ManagerUpdateInput) => {
  await getManagerById(id);
  return prisma.manager.update({ where: { id }, data });
};

export const deleteManagerById = async (id: string) => {
  await getManagerById(id);
  try {
    return await prisma.manager.delete({ where: { id } });
  } catch {
    throw new ApiError(409, "Manager is referenced by properties and cannot be deleted");
  }
};
