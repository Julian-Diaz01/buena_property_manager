import { Router } from "express";
import { success } from "../../lib/http.js";
import { parseBody } from "../../lib/validation.js";
import {
  addUnitsToBuildingById,
  createBuilding,
  deleteBuildingById,
  getBuildingById,
  listBuildings,
  updateBuildingById,
} from "./buildings.service.js";
import { addUnitsSchema, buildingCreateSchema, buildingUpdateSchema } from "./buildings.schemas.js";

export const buildingsRouter = Router();

buildingsRouter.get("/", async (req, res) => {
  const buildings = await listBuildings({
    propertyId: req.query.propertyId as string | undefined,
    street: req.query.street as string | undefined,
  });
  res.json(success(buildings));
});

buildingsRouter.post("/", async (req, res) => {
  const input = parseBody(buildingCreateSchema, req.body);
  const building = await createBuilding(input);
  res.status(201).json(success(building));
});

buildingsRouter.get("/:id", async (req, res) => {
  const building = await getBuildingById(req.params.id);
  res.json(success(building));
});

buildingsRouter.patch("/:id", async (req, res) => {
  const input = parseBody(buildingUpdateSchema, req.body);
  const building = await updateBuildingById(req.params.id, input);
  res.json(success(building));
});

buildingsRouter.patch("/:id/add_unit", async (req, res) => {
  const input = parseBody(addUnitsSchema, req.body);
  const building = await addUnitsToBuildingById(req.params.id, input);
  res.json(success(building));
});

buildingsRouter.delete("/:id", async (req, res) => {
  const deleted = await deleteBuildingById(req.params.id);
  res.json(success(deleted));
});
