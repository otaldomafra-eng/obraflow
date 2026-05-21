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

vi.mock("crypto", () => ({
  randomUUID: vi.fn(() => "test-uuid-123"),
}));

import {
  createService,
  updateService,
  generatePortalToken,
  disablePortal,
  getPortalService,
} from "@/features/services/actions";

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

  it("updateService without clientId or propertyId skips ownership checks", async () => {
    prismaMock.client.findUnique.mockClear();
    prismaMock.property.findUnique.mockClear();
    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      title: "Título Atualizado",
    });

    const result = await updateService("tenant-1", "service-1", {
      title: "Título Atualizado",
    });

    expect(result.title).toBe("Título Atualizado");
    expect(prismaMock.client.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.property.findUnique).not.toHaveBeenCalled();
  });

  it("updateService with valid clientId change passes ownership check", async () => {
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-2" });
    prismaMock.service.findUnique.mockResolvedValue({
      clientId: "client-1",
      propertyId: null,
    });
    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      tenantId: "tenant-1",
      clientId: "client-2",
      title: "Serviço Transferido",
    });

    const result = await updateService("tenant-1", "service-1", {
      clientId: "client-2",
      title: "Serviço Transferido",
    });

    expect(result.clientId).toBe("client-2");
    expect(prismaMock.client.findUnique).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "client-2" } },
      select: { id: true },
    });
  });

  it("updateService without propertyId does not trigger property ownership check", async () => {
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-1" });
    prismaMock.property.findUnique.mockClear();
    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      propertyId: null,
      title: "Sem Imóvel",
    });

    const result = await updateService("tenant-1", "service-1", {
      clientId: "client-1",
      title: "Sem Imóvel",
    });

    expect(result.title).toBe("Sem Imóvel");
    expect(prismaMock.property.findUnique).not.toHaveBeenCalled();
  });

  it("updateService clears description when null is passed", async () => {
    prismaMock.client.findUnique.mockClear();
    prismaMock.property.findUnique.mockClear();
    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      propertyId: null,
      title: "Serviço",
      description: null,
    });

    const result = await updateService("tenant-1", "service-1", {
      title: "Serviço",
      description: null,
    });

    expect(result.description).toBeNull();
    expect(prismaMock.service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: null }),
      }),
    );
  });

  it("updateService clears startDate and dueDate when null is passed", async () => {
    prismaMock.client.findUnique.mockClear();
    prismaMock.property.findUnique.mockClear();
    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      title: "Serviço",
      startDate: null,
      dueDate: null,
    });

    const result = await updateService("tenant-1", "service-1", {
      title: "Serviço",
      startDate: null,
      dueDate: null,
    });

    expect(result.startDate).toBeNull();
    expect(result.dueDate).toBeNull();
    expect(prismaMock.service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ startDate: null, dueDate: null }),
      }),
    );
  });

  it("updateService skips optional fields when not in input", async () => {
    prismaMock.client.findUnique.mockClear();
    prismaMock.property.findUnique.mockClear();
    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      title: "Só Título",
    });

    await updateService("tenant-1", "service-1", {
      title: "Só Título",
    });

    const callData = prismaMock.service.update.mock.calls[0][0].data;
    expect(callData).not.toHaveProperty("startDate");
    expect(callData).not.toHaveProperty("dueDate");
    expect(callData).not.toHaveProperty("description");
    expect(callData).not.toHaveProperty("artNumber");
    expect(callData).not.toHaveProperty("technicalLead");
    expect(callData).not.toHaveProperty("councilRegNumber");
    expect(callData).not.toHaveProperty("internalCode");
  });

  it("createService persists technical fields", async () => {
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-1" });
    prismaMock.service.create.mockResolvedValue({
      id: "service-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      title: "Serviço Técnico",
      type: "TECHNICAL_PROJECT",
      artNumber: "ART-123",
      technicalLead: "Eng. Silva",
      councilRegNumber: "CREA-SP 12345",
      internalCode: "SRV-001",
    });

    const result = await createService("tenant-1", {
      clientId: "client-1",
      title: "Serviço Técnico",
      type: "TECHNICAL_PROJECT",
      artNumber: "ART-123",
      technicalLead: "Eng. Silva",
      councilRegNumber: "CREA-SP 12345",
      internalCode: "SRV-001",
    });

    expect(result.artNumber).toBe("ART-123");
    expect(result.technicalLead).toBe("Eng. Silva");
    expect(result.councilRegNumber).toBe("CREA-SP 12345");
    expect(result.internalCode).toBe("SRV-001");
    expect(prismaMock.service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          artNumber: "ART-123",
          technicalLead: "Eng. Silva",
          councilRegNumber: "CREA-SP 12345",
          internalCode: "SRV-001",
        }),
      }),
    );
  });

  it("createService allows omitting all technical fields", async () => {
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-1" });
    prismaMock.service.create.mockResolvedValue({
      id: "service-2",
      tenantId: "tenant-1",
      clientId: "client-1",
      title: "Serviço Simples",
      type: "CONSULTING",
    });

    const result = await createService("tenant-1", {
      clientId: "client-1",
      title: "Serviço Simples",
      type: "CONSULTING",
    });

    expect(result.title).toBe("Serviço Simples");
    expect(prismaMock.service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          artNumber: null,
          technicalLead: null,
          councilRegNumber: null,
          internalCode: null,
        }),
      }),
    );
  });

  it("updateService persists technical fields", async () => {
    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      title: "Atualizado",
      artNumber: "ART-456",
      technicalLead: "Eng. Souza",
    });

    const result = await updateService("tenant-1", "service-1", {
      title: "Atualizado",
      artNumber: "ART-456",
      technicalLead: "Eng. Souza",
    });

    expect(result.artNumber).toBe("ART-456");
    expect(result.technicalLead).toBe("Eng. Souza");
    expect(prismaMock.service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          artNumber: "ART-456",
          technicalLead: "Eng. Souza",
        }),
      }),
    );
  });

  it("updateService clears technical fields when null is passed", async () => {
    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      title: "Limpo",
      artNumber: null,
      internalCode: null,
    });

    const result = await updateService("tenant-1", "service-1", {
      title: "Limpo",
      artNumber: null,
      internalCode: null,
    });

    expect(result.artNumber).toBeNull();
    expect(result.internalCode).toBeNull();
    expect(prismaMock.service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ artNumber: null, internalCode: null }),
      }),
    );
  });

  it("updateService skips technical fields when not in input", async () => {
    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      tenantId: "tenant-1",
      clientId: "client-1",
      title: "Só Título",
    });

    await updateService("tenant-1", "service-1", {
      title: "Só Título",
    });

    const callData = prismaMock.service.update.mock.calls[0][0].data;
    expect(callData).not.toHaveProperty("artNumber");
    expect(callData).not.toHaveProperty("technicalLead");
    expect(callData).not.toHaveProperty("councilRegNumber");
    expect(callData).not.toHaveProperty("internalCode");
  });
});

describe("portal actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generatePortalToken creates token and returns URL", async () => {
    prismaMock.service.findUnique
      .mockResolvedValueOnce({ id: "service-1" })
      .mockResolvedValueOnce(null);

    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      portalToken: "test-uuid-123",
      portalEnabled: true,
    });

    const url = await generatePortalToken("tenant-1", "service-1");

    expect(url).toBe("http://localhost:3000/portal/test-uuid-123");
    expect(prismaMock.service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_id: { tenantId: "tenant-1", id: "service-1" } },
        data: { portalToken: "test-uuid-123", portalEnabled: true },
      }),
    );
  });

  it("generatePortalToken rejects when service does not belong to tenant", async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);

    await expect(
      generatePortalToken("tenant-1", "service-1"),
    ).rejects.toThrow("does not belong to tenant");
  });

  it("disablePortal sets enabled false and clears token", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "service-1" });
    prismaMock.service.update.mockResolvedValue({
      id: "service-1",
      portalEnabled: false,
      portalToken: null,
    });

    await disablePortal("tenant-1", "service-1");

    expect(prismaMock.service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_id: { tenantId: "tenant-1", id: "service-1" } },
        data: { portalEnabled: false, portalToken: null },
      }),
    );
  });

  it("disablePortal rejects when service does not belong to tenant", async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);

    await expect(
      disablePortal("tenant-1", "service-1"),
    ).rejects.toThrow("does not belong to tenant");
  });

  it("getPortalService returns null when portal is disabled", async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);

    const result = await getPortalService("invalid-token");

    expect(result).toBeNull();
  });

  it("getPortalService filters documents to CLIENT_VISIBLE only", async () => {
    const mockService = {
      id: "service-1",
      title: "Portal Service",
      status: "PRODUCTION",
      dueDate: null,
      portalEnabled: true,
      client: { name: "Cliente Portal" },
      documents: [
        { id: "doc-1", title: "Documento Visível", url: "https://exemplo.com/doc1", mimeType: "application/pdf" },
      ],
      tasks: [],
    };

    prismaMock.service.findUnique.mockResolvedValue(mockService);

    const result = await getPortalService("valid-token");

    expect(result).not.toBeNull();
    expect(result!.documents).toHaveLength(1);
    expect(result!.documents[0].title).toBe("Documento Visível");
    expect(result!.client.name).toBe("Cliente Portal");
    expect(result!.title).toBe("Portal Service");
  });
});
