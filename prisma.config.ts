import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env["DATABASE_URL"] ??
      "postgresql://obraflow:obraflow@localhost:5432/obraflow",
  },
});
