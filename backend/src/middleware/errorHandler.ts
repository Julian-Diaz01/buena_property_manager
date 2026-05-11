import prismaClientPkg from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/http.js";

const { Prisma } = prismaClientPkg;

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message, details: err.details });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ message: "Unique constraint conflict", details: err.meta });
      return;
    }
    if (err.code === "P2003") {
      res.status(409).json({ message: "Foreign key constraint conflict", details: err.meta });
      return;
    }
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  console.error(`[ERROR] ${message}`);
  res.status(500).json({ message: "Internal server error" });
};
