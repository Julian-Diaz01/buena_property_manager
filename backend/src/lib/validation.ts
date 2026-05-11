import { ZodError, type ZodTypeAny } from "zod";
import { ApiError } from "./http.js";

export const parseBody = <T extends ZodTypeAny>(schema: T, payload: unknown) => {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(400, "Validation failed", error.flatten());
    }
    throw error;
  }
};
