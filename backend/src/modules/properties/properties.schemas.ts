import prismaClientPkg from "@prisma/client";
import { z } from "zod";

const { PropertyType } = prismaClientPkg;

const buildingNestedSchema = z.object({
  street: z.string().trim().min(1).max(200),
  houseNumber: z.string().trim().min(1).max(50),
  floors: z.number().int().nonnegative().optional(),
  maxApartments: z.number().int().nonnegative().optional(),
  description: z.string().trim().max(1000).optional(),
  entrances: z.array(z.string().trim().max(50)).optional(),
});

export const propertyCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.nativeEnum(PropertyType),
  managerId: z.string().trim().min(1),
  accountantId: z.string().trim().min(1),
  buildings: z.array(buildingNestedSchema).optional(),
});

export const propertyUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    type: z.nativeEnum(PropertyType).optional(),
    managerId: z.string().trim().min(1).optional(),
    accountantId: z.string().trim().min(1).optional(),
    buildings: z.array(buildingNestedSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");
