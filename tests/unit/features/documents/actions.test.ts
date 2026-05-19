import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    document: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    service: { findUnique: vi.fn() },
    proposal: { findFirst: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import {
  createDocument,
  getDocument,
  listDocuments,
  updateDocument,
} from "@/features/documents/actions";

describe("document actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDocument", () => {
    it("creates a document successfully", async () => {
      prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
      prismaMock.document.create.mockResolvedValue({
        id: "doc-1",
        tenantId: "tenant-1",
        serviceId: "svc-1",
        title: "Contrato",
        url: "https://example.com/contrato.pdf",
        visibility: "INTERNAL",
      });

      const result = await createDocument("tenant-1", {
        serviceId: "svc-1",
        title: "Contrato",
        url: "https://example.com/contrato.pdf",
      });

      expect(result.title).toBe("Contrato");
      expect(prismaMock.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          serviceId: "svc-1",
          title: "Contrato",
          url: "https://example.com/contrato.pdf",
          visibility: "INTERNAL",
        }),
      });
    });

    it("rejects create when service does not belong to tenant", async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      await expect(
        createDocument("tenant-1", {
          serviceId: "svc-nonexistent",
          title: "Documento",
          url: "https://example.com/doc.pdf",
        }),
      ).rejects.toThrow("does not belong to tenant");
    });

    it("validates proposal belongs to service when proposalId provided", async () => {
      prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
      prismaMock.proposal.findFirst.mockResolvedValue(null);

      await expect(
        createDocument("tenant-1", {
          serviceId: "svc-1",
          proposalId: "prop-nonexistent",
          title: "Documento",
          url: "https://example.com/doc.pdf",
        }),
      ).rejects.toThrow("does not belong to service");
    });

    it("creates with proposalId when proposal belongs to service", async () => {
      prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
      prismaMock.proposal.findFirst.mockResolvedValue({ id: "prop-1" });
      prismaMock.document.create.mockResolvedValue({
        id: "doc-1",
        tenantId: "tenant-1",
        serviceId: "svc-1",
        proposalId: "prop-1",
        title: "Documento",
        url: "https://example.com/doc.pdf",
        visibility: "INTERNAL",
      });

      const result = await createDocument("tenant-1", {
        serviceId: "svc-1",
        proposalId: "prop-1",
        title: "Documento",
        url: "https://example.com/doc.pdf",
      });

      expect(result.proposalId).toBe("prop-1");
      expect(prismaMock.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          proposalId: "prop-1",
        }),
      });
    });
  });

  describe("listDocuments", () => {
    it("lists documents filtered by serviceId", async () => {
      prismaMock.document.findMany.mockResolvedValue([]);

      await listDocuments("tenant-1", { serviceId: "svc-1" });

      expect(prismaMock.document.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1", serviceId: "svc-1" },
        orderBy: { createdAt: "desc" },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              client: { select: { id: true, name: true } },
              property: { select: { id: true, name: true } },
            },
          },
          proposal: {
            select: { id: true, title: true },
          },
        },
      });
    });

    it("lists documents filtered by proposalId", async () => {
      prismaMock.document.findMany.mockResolvedValue([]);

      await listDocuments("tenant-1", { proposalId: "prop-1" });

      expect(prismaMock.document.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1", proposalId: "prop-1" },
        orderBy: { createdAt: "desc" },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              client: { select: { id: true, name: true } },
              property: { select: { id: true, name: true } },
            },
          },
          proposal: {
            select: { id: true, title: true },
          },
        },
      });
    });
  });

  describe("getDocument", () => {
    it("gets a single document by id", async () => {
      const mockDocument = {
        id: "doc-1",
        tenantId: "tenant-1",
        serviceId: "svc-1",
        title: "Documento",
        url: "https://example.com/doc.pdf",
        visibility: "INTERNAL",
        service: {
          id: "svc-1",
          title: "Serviço",
          client: { id: "cli-1", name: "Cliente" },
          property: { id: "prop-1", name: "Imóvel" },
        },
        proposal: null,
      };
      prismaMock.document.findFirst.mockResolvedValue(mockDocument);

      const result = await getDocument("tenant-1", "doc-1");

      expect(result).toEqual(mockDocument);
      expect(prismaMock.document.findFirst).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1", id: "doc-1" },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              client: { select: { id: true, name: true } },
              property: { select: { id: true, name: true } },
            },
          },
          proposal: {
            select: { id: true, title: true },
          },
        },
      });
    });

    it("returns null for non-existent document", async () => {
      prismaMock.document.findFirst.mockResolvedValue(null);

      const result = await getDocument("tenant-1", "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("updateDocument", () => {
    it("updates document title", async () => {
      prismaMock.document.findFirst.mockResolvedValue({ id: "doc-1" });
      prismaMock.document.update.mockResolvedValue({
        id: "doc-1",
        tenantId: "tenant-1",
        serviceId: "svc-1",
        title: "Título Atualizado",
        url: "https://example.com/doc.pdf",
        visibility: "INTERNAL",
      });

      await updateDocument("tenant-1", "doc-1", {
        title: "Título Atualizado",
      });

      const updateCall = prismaMock.document.update.mock.calls[0][0];
      expect(updateCall.data.title).toBe("Título Atualizado");
      expect(updateCall.where).toEqual({
        tenantId_id: { tenantId: "tenant-1", id: "doc-1" },
      });
    });

    it("rejects update when document not found", async () => {
      prismaMock.document.findFirst.mockResolvedValue(null);

      await expect(
        updateDocument("tenant-1", "doc-nonexistent", {
          title: "Qualquer",
        }),
      ).rejects.toThrow("not found");
    });
  });
});
