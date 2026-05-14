import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check .env or your hosting environment configuration.`,
    );
  }
  return value;
}

const log: NonNullable<ConstructorParameters<typeof PrismaClient>[0]>["log"] =
  process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"];

const connectionString = requireEnv("DATABASE_URL");

const prismaOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  adapter: new PrismaPg({ connectionString }),
  log,
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
