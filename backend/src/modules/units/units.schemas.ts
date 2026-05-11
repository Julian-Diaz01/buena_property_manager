import { UnitType } from "@prisma/client";
import { z } from "zod";

export const unitCreateSchema = z.object({
  buildingId: z.string().trim().min(1),
  number: z.string().trim().min(1).max(100),
  type: z.nativeEnum(UnitType),
  floor: z.number().int().min(-10).max(300).optional(),
  entrance: z.string().trim().max(50).optional(),
  size: z.coerce.number().nonnegative().optional(),
  coOwnershipShare: z.coerce.number().nonnegative().optional(),
  constructionYear: z.number().int().min(1800).max(2200).optional(),
  rooms: z.number().int().nonnegative().optional(),
});

export const unitUpdateSchema = unitCreateSchema
  .omit({ buildingId: true })
  .extend({ buildingId: z.string().trim().min(1).optional() })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");
