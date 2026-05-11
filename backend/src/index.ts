import "express-async-errors";
import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler.js";
import { accountantsRouter } from "./modules/accountants/accountants.routes.js";
import { buildingsRouter } from "./modules/buildings/buildings.routes.js";
import { contractsRouter } from "./modules/contracts/contracts.routes.js";
import { managersRouter } from "./modules/managers/managers.routes.js";
import { propertiesRouter } from "./modules/properties/properties.routes.js";
import { unitsRouter } from "./modules/units/units.routes.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  }),
);
app.use(express.json());
app.use( morgan(process.env.NODE_ENV ?? "dev"));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use("/api/managers", managersRouter);
app.use("/api/accountants", accountantsRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/buildings", buildingsRouter);
app.use("/api/units", unitsRouter);
app.use("/api/contracts", contractsRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
