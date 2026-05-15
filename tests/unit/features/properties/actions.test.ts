import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    client: {
      findUnique: vi.fn(),
    },
    property: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { createProperty } from "@/features/properties/actions";

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
});
