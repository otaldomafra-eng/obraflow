import { beforeAll, describe, expect, it } from "vitest";

import { createClient, listClients, getClientDetail } from "@/features/clients/actions";
import { createProperty, listProperties } from "@/features/properties/actions";
import { prisma } from "@/server/db/client";

describe.skipIf(process.env.RUN_DB_TESTS !== "1")(
  "clients and properties (DB tests require RUN_DB_TESTS=1)",
  () => {
    let tenantId: string;

    beforeAll(async () => {
      const tenant = await prisma.tenant.findUniqueOrThrow({
        where: { slug: "demo-obraflow" },
      });
      tenantId = tenant.id;
    });

    it("creates a person client", async () => {
      const client = await createClient(tenantId, {
        name: "Maria Souza",
        kind: "PERSON",
        email: "maria@test.local",
        phone: "+55 63 98888-0000",
      });

      expect(client.name).toBe("Maria Souza");
      expect(client.kind).toBe("PERSON");
      expect(client.tenantId).toBe(tenantId);
    });

    it("creates a company client", async () => {
      const client = await createClient(tenantId, {
        name: "Construtora Exemplo Ltda",
        kind: "COMPANY",
        document: "11.222.333/0001-44",
        email: "contato@construtorax.com",
      });

      expect(client.name).toBe("Construtora Exemplo Ltda");
      expect(client.kind).toBe("COMPANY");
      expect(client.document).toBe("11.222.333/0001-44");
    });

    it("links a property to a client", async () => {
      const client = await createClient(tenantId, {
        name: "Proprietario Teste",
        kind: "PERSON",
      });

      const property = await createProperty(tenantId, {
        clientId: client.id,
        name: "Terreno no Jardim Europa",
        address: "Rua das Flores, 123",
        city: "Palmas",
        state: "TO",
      });

      expect(property.name).toBe("Terreno no Jardim Europa");
      expect(property.clientId).toBe(client.id);
    });

    it("lists clients with properties and services count", async () => {
      const result = await listClients(tenantId, { page: 1, pageSize: 10 });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.items[0]).toHaveProperty("name");
      expect(result.items[0]).toHaveProperty("kind");
    });

    it("blocks client creation without tenant", async () => {
      await expect(
        createClient("non-existent-tenant", { name: "Ghost", kind: "PERSON" }),
      ).rejects.toThrow();
    });

    it("gets client detail with linked properties", async () => {
      const client = await createClient(tenantId, {
        name: "Detalhado Teste",
        kind: "PERSON",
      });

      await createProperty(tenantId, {
        clientId: client.id,
        name: "Casa Detalhada",
      });

      const detail = await getClientDetail(tenantId, client.id);

      expect(detail?.name).toBe("Detalhado Teste");
      expect(detail?.properties.length).toBeGreaterThan(0);
    });

    it("lists properties with client info", async () => {
      const result = await listProperties(tenantId, { page: 1, pageSize: 10 });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]).toHaveProperty("name");
    });
  },
);
