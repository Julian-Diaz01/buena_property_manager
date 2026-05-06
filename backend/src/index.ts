import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";

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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});


app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
