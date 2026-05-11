import { Router } from "express";
import { success } from "../../lib/http.js";
import { parseBody } from "../../lib/validation.js";
import { assignExistingContractSchema, createAndAssignContractSchema } from "./contracts.schemas.js";
import {
  assignExistingContractToUnit,
  createAndAssignContractToUnit,
  listContracts,
  removeUnitContract,
} from "./contracts.service.js";

export const contractsRouter = Router();

contractsRouter.get("/", async (_req, res) => {
  const contracts = await listContracts();
  res.json(success(contracts));
});

contractsRouter.patch("/units/:unitId", async (req, res) => {
  const input = parseBody(assignExistingContractSchema, req.body);
  const unit = await assignExistingContractToUnit(req.params.unitId, input);
  res.json(success(unit));
});

contractsRouter.post("/units/:unitId", async (req, res) => {
  const input = parseBody(createAndAssignContractSchema, req.body);
  const unit = await createAndAssignContractToUnit(req.params.unitId, input);
  res.status(201).json(success(unit));
});

contractsRouter.delete("/units/:unitId", async (req, res) => {
  const unit = await removeUnitContract(req.params.unitId);
  res.json(success(unit));
});
