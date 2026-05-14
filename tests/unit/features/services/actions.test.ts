import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    client: {
      findUnique: vi.fn(),
    },
    property: {
      findUnique: vi.fn(),
    },
    service: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { createService, updateService } from "@/features/services/actions";

describe("service actions ownership validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects createService when the property does not belong to the tenant and client", async () => {
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-1" });
    prismaMock.property.findUnique.mockResolvedValue(null);

    await expect(
      createService("tenant-1", {
        clientId: "client-1",
        propertyId: "property-1",
        title: "Servico",
        type: "FIRE_SAFETY",
      }),
    ).rejects.toThrow(
      "Property property-1 does not belong to client client-1 in tenant tenant-1",
    );

    expect(prismaMock.service.create).not.toHaveBeenCalled();
  });

  it("rejects updateService when changing client would orphan the existing property", async () => {
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-2" });
    prismaMock.service.findUnique.mockResolvedValue({
      clientId: "client-1",
      propertyId: "property-1",
    });
    prismaMock.property.findUnique.mockResolvedValue(null);

    await expect(
      updateService("tenant-1", "service-1", {
        clientId: "client-2",
      }),
    ).rejects.toThrow(
      "Property property-1 does not belong to client client-2 in tenant tenant-1",
    );

    expect(prismaMock.property.findUnique).toHaveBeenCalledWith({
      where: {
        tenantId_clientId_id: {
          tenantId: "tenant-1",
          clientId: "client-2",
          id: "property-1",
        },
      },
      select: { id: true },
    });
    expect(prismaMock.service.update).not.toHaveBeenCalled();
  });
});
