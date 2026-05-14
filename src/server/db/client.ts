import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const log: NonNullable<ConstructorParameters<typeof PrismaClient>[0]>["log"] =
  process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"];

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:replace-with-password@db.fhtyhqvxwiajoctailir.supabase.co:5432/postgres?sslmode=require&uselibpqcompat=true";

const prismaOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  adapter: new PrismaPg({ connectionString }),
  log,
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
