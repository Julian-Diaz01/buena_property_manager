import { Router } from "express";
import { success } from "../../lib/http.js";
import { parseBody } from "../../lib/validation.js";
import {
  createAccountant,
  deleteAccountantById,
  getAccountantById,
  listAccountants,
  updateAccountantById,
} from "./accountants.service.js";
import { accountantCreateSchema, accountantUpdateSchema } from "./accountants.schemas.js";

export const accountantsRouter = Router();

accountantsRouter.get("/", async (_req, res) => {
  const accountants = await listAccountants();
  res.json(success(accountants));
});

accountantsRouter.post("/", async (req, res) => {
  const input = parseBody(accountantCreateSchema, req.body);
  const accountant = await createAccountant(input);
  res.status(201).json(success(accountant));
});

accountantsRouter.get("/:id", async (req, res) => {
  const accountant = await getAccountantById(req.params.id);
  res.json(success(accountant));
});

accountantsRouter.patch("/:id", async (req, res) => {
  const input = parseBody(accountantUpdateSchema, req.body);
  const accountant = await updateAccountantById(req.params.id, input);
  res.json(success(accountant));
});

accountantsRouter.delete("/:id", async (req, res) => {
  const deleted = await deleteAccountantById(req.params.id);
  res.json(success(deleted));
});
