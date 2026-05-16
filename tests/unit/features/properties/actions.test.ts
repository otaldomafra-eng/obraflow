import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    client: {
      findUnique: vi.fn(),
    },
    property: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { createProperty, updateProperty } from "@/features/properties/actions";

describe("property actions ownership validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects createProperty when client does not belong to tenant", async () => {
    prismaMock.client.findUnique.mockResolvedValue(null);

    await expect(
      createProperty("tenant-1", {
        clientId: "client-1",
        name: "Terreno Teste",
      }),
    ).rejects.toThrow(
      "Client client-1 does not belong to tenant tenant-1",
    );

    expect(prismaMock.property.create).not.toHaveBeenCalled();
  });

  it("allows createProperty when client belongs to tenant", async () => {
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-1" });
    prismaMock.property.create.mockResolvedValue({
      id: "prop-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      name: "Terreno Teste",
    });

    const result = await createProperty("tenant-1", {
      clientId: "client-1",
      name: "Terreno Teste",
    });

    expect(result.name).toBe("Terreno Teste");
    expect(prismaMock.property.create).toHaveBeenCalledTimes(1);
  });

  it("updateProperty without clientId skips ownership check", async () => {
    prismaMock.client.findUnique.mockClear();
    prismaMock.property.update.mockResolvedValue({
      id: "prop-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      name: "Terreno Atualizado",
    });

    const result = await updateProperty("tenant-1", "prop-1", {
      name: "Terreno Atualizado",
    });

    expect(result.name).toBe("Terreno Atualizado");
    expect(prismaMock.client.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.property.update).toHaveBeenCalledTimes(1);
  });

  it("updateProperty rejeita clientId de outro tenant", async () => {
    prismaMock.client.findUnique.mockResolvedValue(null);
    prismaMock.property.update.mockClear();

    await expect(
      updateProperty("tenant-1", "prop-1", {
        clientId: "client-other-tenant",
        name: "Terreno Inválido",
      }),
    ).rejects.toThrow(
      "Client client-other-tenant does not belong to tenant tenant-1",
    );

    expect(prismaMock.property.update).not.toHaveBeenCalled();
  });

  it("updateProperty permite clientId válido do mesmo tenant", async () => {
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-2" });
    prismaMock.property.update.mockResolvedValue({
      id: "prop-1",
      tenantId: "tenant-1",
      clientId: "client-2",
      name: "Terreno Transferido",
    });

    const result = await updateProperty("tenant-1", "prop-1", {
      clientId: "client-2",
      name: "Terreno Transferido",
    });

    expect(result.name).toBe("Terreno Transferido");
    expect(result.clientId).toBe("client-2");
    expect(prismaMock.client.findUnique).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "client-2" } },
      select: { id: true },
    });
    expect(prismaMock.property.update).toHaveBeenCalledTimes(1);
  });
});
