import { describe, expect, it } from "vitest";

import { prisma } from "@/server/db/client";

describe.skipIf(process.env.RUN_DB_TESTS !== "1")(
  "seed data (DB tests require RUN_DB_TESTS=1 and a migrated/seeded DATABASE_URL)",
  () => {
    it("creates the demo tenant with a client, property, and service", async () => {
      await expect(prisma.$queryRaw`SELECT 1 AS result`).resolves.toEqual([
        { result: 1 },
      ]);

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
        externalKey: "demo-client-joao-silva",
        name: "Joao Silva",
        properties: expect.arrayContaining([
          expect.objectContaining({
            externalKey: "demo-property-casa-pds",
            name: "Casa no Plano Diretor Sul",
          }),
        ]),
        services: expect.arrayContaining([
          expect.objectContaining({
            externalKey: "demo-service-residence-project",
            title: "Projeto + aprovacao + execucao de residencia",
          }),
        ]),
      });
    });
  },
);
