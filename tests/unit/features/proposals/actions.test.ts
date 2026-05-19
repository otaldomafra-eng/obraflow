import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    proposal: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    service: { findUnique: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import {
  createProposal,
  getProposal,
  listProposals,
  updateProposal,
} from "@/features/proposals/actions";

describe("proposal actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProposal", () => {
    it("creates a proposal successfully", async () => {
      prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
      prismaMock.proposal.create.mockResolvedValue({
        id: "prop-1",
        tenantId: "tenant-1",
        serviceId: "svc-1",
        title: "Proposta de Reforma",
        status: "DRAFT",
      });

      const result = await createProposal("tenant-1", {
        serviceId: "svc-1",
        title: "Proposta de Reforma",
      });

      expect(result.title).toBe("Proposta de Reforma");
      expect(prismaMock.proposal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          serviceId: "svc-1",
          title: "Proposta de Reforma",
          status: "DRAFT",
        }),
      });
    });

    it("rejects create when service does not belong to tenant", async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      await expect(
        createProposal("tenant-1", {
          serviceId: "svc-nonexistent",
          title: "Proposta",
        }),
      ).rejects.toThrow("does not belong to tenant");
    });
  });

  describe("listProposals", () => {
    it("lists proposals with service info", async () => {
      const mockProposals = [
        {
          id: "prop-1",
          tenantId: "tenant-1",
          serviceId: "svc-1",
          title: "Proposta A",
          status: "DRAFT",
          service: {
            id: "svc-1",
            title: "Serviço A",
            client: { id: "cli-1", name: "Cliente A" },
            property: { id: "prop-1", name: "Imóvel A" },
          },
        },
      ];
      prismaMock.proposal.findMany.mockResolvedValue(mockProposals);

      const result = await listProposals("tenant-1");

      expect(result).toEqual(mockProposals);
      expect(prismaMock.proposal.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1" },
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
        },
      });
    });

    it("lists proposals filtered by serviceId", async () => {
      prismaMock.proposal.findMany.mockResolvedValue([]);

      await listProposals("tenant-1", { serviceId: "svc-1" });

      expect(prismaMock.proposal.findMany).toHaveBeenCalledWith({
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
        },
      });
    });
  });

  describe("getProposal", () => {
    it("gets a single proposal by id", async () => {
      const mockProposal = {
        id: "prop-1",
        tenantId: "tenant-1",
        serviceId: "svc-1",
        title: "Proposta",
        status: "DRAFT",
        service: {
          id: "svc-1",
          title: "Serviço",
          client: { id: "cli-1", name: "Cliente" },
          property: { id: "prop-1", name: "Imóvel" },
        },
      };
      prismaMock.proposal.findFirst.mockResolvedValue(mockProposal);

      const result = await getProposal("tenant-1", "prop-1");

      expect(result).toEqual(mockProposal);
      expect(prismaMock.proposal.findFirst).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1", id: "prop-1" },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              client: { select: { id: true, name: true } },
              property: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    it("returns null for non-existent proposal", async () => {
      prismaMock.proposal.findFirst.mockResolvedValue(null);

      const result = await getProposal("tenant-1", "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("updateProposal", () => {
    it("updates proposal and sets sentAt when status becomes SENT", async () => {
      prismaMock.proposal.findFirst.mockResolvedValue({
        sentAt: null,
        acceptedAt: null,
      });
      prismaMock.proposal.update.mockResolvedValue({
        id: "prop-1",
        tenantId: "tenant-1",
        serviceId: "svc-1",
        title: "Proposta Atualizada",
        status: "SENT",
        sentAt: new Date(),
      });

      await updateProposal("tenant-1", "svc-1", "prop-1", {
        title: "Proposta Atualizada",
        status: "SENT",
      });

      const updateCall = prismaMock.proposal.update.mock.calls[0][0];
      expect(updateCall.data.title).toBe("Proposta Atualizada");
      expect(updateCall.data.status).toBe("SENT");
      expect(updateCall.data.sentAt).toBeInstanceOf(Date);
    });

    it("clears acceptedAt when status leaves ACCEPTED", async () => {
      prismaMock.proposal.findFirst.mockResolvedValue({
        sentAt: new Date(),
        acceptedAt: new Date("2026-05-01"),
      });
      prismaMock.proposal.update.mockResolvedValue({
        id: "prop-1",
        tenantId: "tenant-1",
        serviceId: "svc-1",
        title: "Proposta",
        status: "REJECTED",
      });

      await updateProposal("tenant-1", "svc-1", "prop-1", {
        status: "REJECTED",
      });

      const updateCall = prismaMock.proposal.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe("REJECTED");
      expect(updateCall.data.acceptedAt).toBeNull();
    });

    it("rejects update when proposal not found", async () => {
      prismaMock.proposal.findFirst.mockResolvedValue(null);

      await expect(
        updateProposal("tenant-1", "svc-1", "prop-nonexistent", {
          title: "Qualquer",
        }),
      ).rejects.toThrow("does not belong to service");
    });

    it("does not overwrite sentAt when already set", async () => {
      const existingSentAt = new Date("2026-05-01");
      prismaMock.proposal.findFirst.mockResolvedValue({
        sentAt: existingSentAt,
        acceptedAt: null,
      });
      prismaMock.proposal.update.mockResolvedValue({} as never);

      await updateProposal("tenant-1", "svc-1", "prop-1", {
        status: "SENT",
      });

      const updateCall = prismaMock.proposal.update.mock.calls[0][0];
      expect(updateCall.data.sentAt).toBeUndefined();
    });

    it("does not overwrite acceptedAt when already set", async () => {
      const existingAcceptedAt = new Date("2026-05-01");
      prismaMock.proposal.findFirst.mockResolvedValue({
        sentAt: new Date(),
        acceptedAt: existingAcceptedAt,
      });
      prismaMock.proposal.update.mockResolvedValue({} as never);

      await updateProposal("tenant-1", "svc-1", "prop-1", {
        status: "ACCEPTED",
      });

      const updateCall = prismaMock.proposal.update.mock.calls[0][0];
      expect(updateCall.data.acceptedAt).toBeUndefined();
    });

    it("does not clear acceptedAt when staying in ACCEPTED", async () => {
      prismaMock.proposal.findFirst.mockResolvedValue({
        sentAt: new Date(),
        acceptedAt: new Date("2026-05-01"),
      });
      prismaMock.proposal.update.mockResolvedValue({} as never);

      await updateProposal("tenant-1", "svc-1", "prop-1", {
        title: "Novo título",
        status: "ACCEPTED",
      });

      const updateCall = prismaMock.proposal.update.mock.calls[0][0];
      expect(updateCall.data.acceptedAt).toBeUndefined();
    });

    it("sets acceptedAt when moving to ACCEPTED", async () => {
      prismaMock.proposal.findFirst.mockResolvedValue({
        sentAt: new Date(),
        acceptedAt: null,
      });
      prismaMock.proposal.update.mockResolvedValue({} as never);

      await updateProposal("tenant-1", "svc-1", "prop-1", {
        status: "ACCEPTED",
      });

      const updateCall = prismaMock.proposal.update.mock.calls[0][0];
      expect(updateCall.data.acceptedAt).toBeInstanceOf(Date);
    });

    it("ignores serviceId if passed in input", async () => {
      prismaMock.proposal.findFirst.mockResolvedValue({
        sentAt: null,
        acceptedAt: null,
      });
      prismaMock.proposal.update.mockResolvedValue({} as never);

      await updateProposal("tenant-1", "svc-1", "prop-1", {
        title: "Atualizado",
        serviceId: "svc-2" as unknown as undefined,
      } as never);

      const updateCall = prismaMock.proposal.update.mock.calls[0][0];
      expect(updateCall.data.serviceId).toBeUndefined();
    });
  });
});
