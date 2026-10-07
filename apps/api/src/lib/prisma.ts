/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Centralized Prisma Client Singleton to prevent connection pool exhaustion.
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env is loaded before initializing Prisma Client
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function getOptimizedDbUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  const defaultLimit = process.env.PRISMA_CONNECTION_LIMIT || "30";
  const defaultTimeout = process.env.PRISMA_POOL_TIMEOUT || "30";

  let finalUrl = url;
  if (!finalUrl.includes("connection_limit=")) {
    const sep = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${sep}connection_limit=${defaultLimit}`;
  }
  if (!finalUrl.includes("pool_timeout=")) {
    const sep = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${sep}pool_timeout=${defaultTimeout}`;
  }
  return finalUrl;
}

const dbUrl = getOptimizedDbUrl();

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error", "warn"],
  });

globalThis.prismaGlobal = prisma;

export default prisma;
