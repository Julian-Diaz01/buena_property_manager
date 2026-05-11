import prismaClientPkg from "@prisma/client";
import { z } from "zod";

const { UnitType } = prismaClientPkg;

export const unitNestedSchema = z.object({
  number: z.string().trim().min(1).max(100),
  type: z.nativeEnum(UnitType),
  floor: z.number().int().min(-10).max(300).optional(),
  entrance: z.string().trim().max(50).optional(),
  size: z.coerce.number().nonnegative().optional(),
  coOwnershipShare: z.coerce.number().nonnegative().optional(),
  constructionYear: z.number().int().min(1800).max(2200).optional(),
  rooms: z.number().int().nonnegative().optional(),
});

export const buildingCreateSchema = z.object({
  propertyId: z.string().trim().min(1),
  street: z.string().trim().min(1).max(200),
  houseNumber: z.string().trim().min(1).max(50),
  floors: z.number().int().nonnegative().optional(),
  maxApartments: z.number().int().nonnegative().optional(),
  description: z.string().trim().max(1000).optional(),
  entrances: z.array(z.string().trim().max(50)).optional(),
  units: z.array(unitNestedSchema).optional(),
});

export const buildingUpdateSchema = z
  .object({
    propertyId: z.string().trim().min(1).optional(),
    street: z.string().trim().min(1).max(200).optional(),
    houseNumber: z.string().trim().min(1).max(50).optional(),
    floors: z.number().int().nonnegative().optional(),
    maxApartments: z.number().int().nonnegative().optional(),
    description: z.string().trim().max(1000).optional(),
    entrances: z.array(z.string().trim().max(50)).optional(),
    units: z.array(unitNestedSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const addUnitsSchema = z.object({
  units: z.array(unitNestedSchema).min(1),
});
