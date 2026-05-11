import { Router } from "express";
import { success } from "../../lib/http.js";
import { parseBody } from "../../lib/validation.js";
import { createUnit, deleteUnitById, getUnitById, listUnits, updateUnitById } from "./units.service.js";
import { unitCreateSchema, unitUpdateSchema } from "./units.schemas.js";

export const unitsRouter = Router();

unitsRouter.get("/", async (req, res) => {
  const units = await listUnits({
    buildingId: req.query.buildingId as string | undefined,
    type: req.query.type as string | undefined,
    floor: req.query.floor as string | undefined,
    entrance: req.query.entrance as string | undefined,
  });
  res.json(success(units));
});

unitsRouter.post("/", async (req, res) => {
  const input = parseBody(unitCreateSchema, req.body);
  const unit = await createUnit(input);
  res.status(201).json(success(unit));
});

unitsRouter.get("/:id", async (req, res) => {
  const unit = await getUnitById(req.params.id);
  res.json(success(unit));
});

unitsRouter.patch("/:id", async (req, res) => {
  const input = parseBody(unitUpdateSchema, req.body);
  const unit = await updateUnitById(req.params.id, input);
  res.json(success(unit));
});

unitsRouter.delete("/:id", async (req, res) => {
  const deleted = await deleteUnitById(req.params.id);
  res.json(success(deleted));
});
