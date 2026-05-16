import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    client: {
      findUnique: vi.fn(),
    },
    property: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { createProperty, getPropertyDetail, updateProperty } from "@/features/properties/actions";

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

  it("getPropertyDetail returns property with client and services", async () => {
    const mockResult = {
      id: "prop-1",
      name: "Casa Teste",
      client: { id: "client-1", name: "Joao", email: null, phone: null },
      services: [{ id: "svc-1", title: "Proj", status: "NEW" }],
    };
    prismaMock.property.findUnique.mockResolvedValue(mockResult);

    const result = await getPropertyDetail("tenant-1", "prop-1");

    expect(result).toEqual(mockResult);
    expect(prismaMock.property.findUnique).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "prop-1" } },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        services: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
  });

  it("updateProperty clears optional fields when null is passed", async () => {
    prismaMock.client.findUnique.mockClear();
    prismaMock.property.update.mockResolvedValue({
      id: "prop-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      name: "Casa",
      address: null,
      city: null,
      state: null,
      postalCode: null,
      notes: null,
    });

    const result = await updateProperty("tenant-1", "prop-1", {
      name: "Casa",
      address: null,
      city: null,
      state: null,
      postalCode: null,
      notes: null,
    });

    expect(result.address).toBeNull();
    expect(result.city).toBeNull();
    expect(result.state).toBeNull();
    expect(result.postalCode).toBeNull();
    expect(result.notes).toBeNull();
    expect(prismaMock.property.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "prop-1" } },
      data: {
        name: "Casa",
        address: null,
        city: null,
        state: null,
        postalCode: null,
        notes: null,
      },
    });
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
