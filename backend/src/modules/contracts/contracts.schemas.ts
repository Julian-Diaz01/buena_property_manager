import { z } from "zod";

export const assignExistingContractSchema = z.object({
  contractId: z.string().trim().min(1),
});

export const createAndAssignContractSchema = z.object({
  name: z.string().trim().min(1).max(200),
});
