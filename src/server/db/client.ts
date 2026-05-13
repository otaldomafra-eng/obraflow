import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const log: NonNullable<ConstructorParameters<typeof PrismaClient>[0]>["log"] =
  process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"];

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://obraflow:obraflow@localhost:5432/obraflow";

const prismaOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  adapter: new PrismaPg({ connectionString }),
  log,
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
