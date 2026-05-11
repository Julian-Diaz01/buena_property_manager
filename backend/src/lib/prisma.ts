import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPkg from "@prisma/client";
import type { PrismaClient as PrismaClientType } from "@prisma/client";

const { PrismaClient } = prismaClientPkg;

dotenv.config({ path: ".env.local" });
dotenv.config();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    adapter: new PrismaPg({
      connectionString: databaseUrl,
    }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
