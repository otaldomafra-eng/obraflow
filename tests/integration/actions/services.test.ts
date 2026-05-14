import { beforeAll, describe, expect, it } from "vitest";

import { createClient } from "@/features/clients/actions";
import { createProperty } from "@/features/properties/actions";
import { createService, updateService } from "@/features/services/actions";
import { prisma } from "@/server/db/client";

describe.skipIf(process.env.RUN_DB_TESTS !== "1")(
  "services ownership validation (DB tests require RUN_DB_TESTS=1)",
  () => {
    let tenantId: string;

    beforeAll(async () => {
      const tenant = await prisma.tenant.findUniqueOrThrow({
        where: { slug: "demo-obraflow" },
      });
      tenantId = tenant.id;
    });

    it("rejects creating a service with another client's property", async () => {
      const suffix = `create-${Date.now()}`;
      const owner = await createClient(tenantId, {
        name: `Owner ${suffix}`,
        kind: "PERSON",
      });
      const otherClient = await createClient(tenantId, {
        name: `Other ${suffix}`,
        kind: "PERSON",
      });
      const otherProperty = await createProperty(tenantId, {
        clientId: otherClient.id,
        name: `Other Property ${suffix}`,
      });

      await expect(
        createService(tenantId, {
          clientId: owner.id,
          propertyId: otherProperty.id,
          title: `Service ${suffix}`,
          type: "FIRE_SAFETY",
        }),
      ).rejects.toThrow(
        `Property ${otherProperty.id} does not belong to client ${owner.id} in tenant ${tenantId}`,
      );
    });

    it("rejects changing the client while retaining an incompatible property", async () => {
      const suffix = `update-${Date.now()}`;
      const owner = await createClient(tenantId, {
        name: `Owner ${suffix}`,
        kind: "PERSON",
      });
      const nextClient = await createClient(tenantId, {
        name: `Next ${suffix}`,
        kind: "PERSON",
      });
      const property = await createProperty(tenantId, {
        clientId: owner.id,
        name: `Owner Property ${suffix}`,
      });
      const service = await createService(tenantId, {
        clientId: owner.id,
        propertyId: property.id,
        title: `Service ${suffix}`,
        type: "FIRE_SAFETY",
      });

      await expect(
        updateService(tenantId, service.id, {
          clientId: nextClient.id,
        }),
      ).rejects.toThrow(
        `Property ${property.id} does not belong to client ${nextClient.id} in tenant ${tenantId}`,
      );
    });
  },
);
