import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const localDatabaseUrl =
  "postgresql://obraflow:obraflow@localhost:55432/obraflow";

function readProjectFile(...segments: string[]) {
  return readFileSync(join(root, ...segments), "utf8");
}

describe("local development setup", () => {
  it("ships a dedicated Docker PostgreSQL service for reproducible e2e runs", () => {
    const composePath = join(root, "docker-compose.yml");

    expect(existsSync(composePath)).toBe(true);

    const compose = readProjectFile("docker-compose.yml");

    expect(compose).toContain("postgres:");
    expect(compose).toContain("POSTGRES_DB: obraflow");
    expect(compose).toContain("POSTGRES_USER: obraflow");
    expect(compose).toContain("POSTGRES_PASSWORD: obraflow");
    expect(compose).toContain('"55432:5432"');
  });

  it("documents and scripts the database bootstrap before Playwright starts", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const playwrightConfig = readProjectFile("playwright.config.ts");
    const envExample = readProjectFile(".env.example");
    const readme = readProjectFile("README.md");

    expect(packageJson.scripts["db:up"]).toBe("docker compose up -d postgres");
    expect(packageJson.scripts["db:wait"]).toBe("tsx scripts/wait-for-db.ts");
    expect(packageJson.scripts["db:deploy"]).toBe("prisma migrate deploy");
    expect(packageJson.scripts["db:setup"]).toBe(
      "pnpm db:up && pnpm db:wait && pnpm db:generate && pnpm db:deploy && pnpm db:seed",
    );

    expect(playwrightConfig).toContain('command: "pnpm db:setup && pnpm dev"');
    expect(envExample).toContain(`DATABASE_URL="${localDatabaseUrl}"`);
    expect(readme).toContain("pnpm db:setup");
  });

  it("keeps the database wait script compatible with the project tsx runtime", () => {
    const waitScript = readProjectFile("scripts", "wait-for-db.ts");

    expect(waitScript).toContain("async function main()");
    expect(waitScript).toContain("main().catch");
    expect(waitScript).not.toMatch(/^await\s/m);
  });
});
