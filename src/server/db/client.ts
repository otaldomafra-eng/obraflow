import { PrismaClient } from "@prisma/client";
import { createRequire } from "node:module";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const require = createRequire(import.meta.url);

const log: NonNullable<ConstructorParameters<typeof PrismaClient>[0]>["log"] =
  process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"];

function createUnavailableAdapter() {
  const error = () => {
    throw new Error(
      "Prisma 7 requires @prisma/adapter-pg before database queries can run.",
    );
  };

  return new Proxy(
    {
      adapterName: "missing-prisma-pg-adapter",
      provider: "postgres",
    },
    {
      get(target, property) {
        if (property in target) {
          return target[property as keyof typeof target];
        }

        return error;
      },
    },
  );
}

function createPrismaOptions(): ConstructorParameters<typeof PrismaClient>[0] {
  try {
    const { PrismaPg } = require("@prisma/adapter-pg") as {
      PrismaPg: new (config: { connectionString: string }) => unknown;
    };

    return {
      adapter: new PrismaPg({
        connectionString:
          process.env.DATABASE_URL ??
          "postgresql://obraflow:obraflow@localhost:5432/obraflow",
      }),
      log,
    } as ConstructorParameters<typeof PrismaClient>[0];
  } catch {
    return {
      adapter: createUnavailableAdapter(),
      log,
    } as ConstructorParameters<typeof PrismaClient>[0];
  }
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(createPrismaOptions());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
