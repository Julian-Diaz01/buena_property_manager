import { Router } from "express";
import { success } from "../../lib/http.js";
import { parseBody } from "../../lib/validation.js";
import {
  createProperty,
  deletePropertyById,
  getPropertyById,
  listProperties,
  updatePropertyById,
} from "./properties.service.js";
import { propertyCreateSchema, propertyUpdateSchema } from "./properties.schemas.js";

export const propertiesRouter = Router();

propertiesRouter.get("/", async (req, res) => {
  const properties = await listProperties({
    type: req.query.type as string | undefined,
    managerId: req.query.managerId as string | undefined,
    accountantId: req.query.accountantId as string | undefined,
    search: req.query.search as string | undefined,
  });
  res.json(success(properties));
});

propertiesRouter.post("/", async (req, res) => {
  const input = parseBody(propertyCreateSchema, req.body);
  const property = await createProperty(input);
  res.status(201).json(success(property));
});

propertiesRouter.get("/:id", async (req, res) => {
  const property = await getPropertyById(req.params.id);
  res.json(success(property));
});

propertiesRouter.patch("/:id", async (req, res) => {
  const input = parseBody(propertyUpdateSchema, req.body);
  const property = await updatePropertyById(req.params.id, input);
  res.json(success(property));
});

propertiesRouter.delete("/:id", async (req, res) => {
  const deleted = await deletePropertyById(req.params.id);
  res.json(success(deleted));
});
