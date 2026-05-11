import { z } from "zod";

export const accountantCreateSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
});

export const accountantUpdateSchema = accountantCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required",
);
