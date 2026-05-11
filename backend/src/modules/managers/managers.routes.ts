import { Router } from "express";
import { success } from "../../lib/http.js";
import { parseBody } from "../../lib/validation.js";
import { createManager, deleteManagerById, getManagerById, listManagers, updateManagerById } from "./managers.service.js";
import { managerCreateSchema, managerUpdateSchema } from "./managers.schemas.js";

export const managersRouter = Router();

managersRouter.get("/", async (_req, res) => {
  const managers = await listManagers();
  res.json(success(managers));
});

managersRouter.post("/", async (req, res) => {
  const input = parseBody(managerCreateSchema, req.body);
  const manager = await createManager(input);
  res.status(201).json(success(manager));
});

managersRouter.get("/:id", async (req, res) => {
  const manager = await getManagerById(req.params.id);
  res.json(success(manager));
});

managersRouter.patch("/:id", async (req, res) => {
  const input = parseBody(managerUpdateSchema, req.body);
  const manager = await updateManagerById(req.params.id, input);
  res.json(success(manager));
});

managersRouter.delete("/:id", async (req, res) => {
  const deleted = await deleteManagerById(req.params.id);
  res.json(success(deleted));
});
