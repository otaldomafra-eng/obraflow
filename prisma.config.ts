import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

import { defineConfig } from "prisma/config";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env["DATABASE_URL"] ??
      "postgresql://postgres:replace-with-password@db.fhtyhqvxwiajoctailir.supabase.co:5432/postgres?sslmode=require&uselibpqcompat=true",
  },
});
