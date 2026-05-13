import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

import { prisma } from "@/server/db/client";

const require = createRequire(import.meta.url);

function hasPrismaPgAdapter() {
  try {
    require.resolve("@prisma/adapter-pg");
    return true;
  } catch {
    return false;
  }
}

async function hasIntegrationDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!hasPrismaPgAdapter())(
  "seed data (requires @prisma/adapter-pg)",
  () => {
    it("creates the demo tenant with a client, property, and service", async () => {
      if (!(await hasIntegrationDatabase())) {
        console.warn(
          "Skipping seed integration test because DATABASE_URL is not reachable.",
        );
        return;
      }

      const tenant = await prisma.tenant.findUnique({
        where: { slug: "demo-obraflow" },
        include: {
          clients: {
            orderBy: { createdAt: "asc" },
            include: {
              properties: true,
              services: true,
            },
          },
        },
      });

      expect(tenant?.name).toBe("Demo ObraFlow");
      expect(tenant?.clients[0]).toMatchObject({
        name: "Joao Silva",
        properties: expect.arrayContaining([
          expect.objectContaining({ name: "Casa no Plano Diretor Sul" }),
        ]),
        services: expect.arrayContaining([
          expect.objectContaining({
            title: "Projeto + aprovacao + execucao de residencia",
          }),
        ]),
      });
    });
  },
);
