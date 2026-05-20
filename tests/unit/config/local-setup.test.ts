import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readProjectFile(...segments: string[]) {
  return readFileSync(join(root, ...segments), "utf8");
}

describe("remote development database setup", () => {
  it("does not require Docker or a local PostgreSQL service", () => {
    expect(existsSync(join(root, "docker-compose.yml"))).toBe(false);
    expect(existsSync(join(root, "scripts", "wait-for-db.ts"))).toBe(false);
  });

  it("documents and scripts Supabase-backed database setup", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const playwrightConfig = readProjectFile("playwright.config.ts");
    const envExample = readProjectFile(".env.example");
    const prismaConfig = readProjectFile("prisma.config.ts");
    const seedScript = readProjectFile("prisma", "seed.ts");
    const readme = readProjectFile("README.md");

    expect(packageJson.scripts["db:up"]).toBeUndefined();
    expect(packageJson.scripts["db:wait"]).toBeUndefined();
    expect(packageJson.scripts["db:deploy"]).toBe("prisma migrate deploy");
    expect(packageJson.scripts["db:setup"]).toBe(
      "pnpm db:generate && pnpm db:deploy && pnpm db:seed",
    );

    expect(playwrightConfig).toContain('command: "pnpm dev"');
    expect(playwrightConfig).not.toContain("pnpm db:setup");
    expect(prismaConfig).toContain("loadEnvFile");
    expect(seedScript).toContain("loadEnvFile");
    expect(envExample).toContain("DATABASE_URL=");
    expect(envExample).toContain("DEMO_LOGIN_ENABLED=");
    expect(readme).toContain("<POOLER_HOST>:6543");
    expect(readme).toContain("Supabase");
    expect(readme).not.toContain("Docker PostgreSQL");
  });
});
