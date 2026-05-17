import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    client: {
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

import { createClient, updateClient, getClientDetail } from "@/features/clients/actions";

describe("client actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createClient", () => {
    it("cria cliente com campos obrigatórios", async () => {
      prismaMock.client.create.mockResolvedValue({
        id: "client-1",
        tenantId: "tenant-1",
        name: "Maria Souza",
        kind: "PERSON",
      });

      const result = await createClient("tenant-1", {
        name: "Maria Souza",
        kind: "PERSON",
      });

      expect(result.name).toBe("Maria Souza");
      expect(prismaMock.client.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          name: "Maria Souza",
          kind: "PERSON",
        }),
      });
    });

    it("cria cliente com todos os campos opcionais", async () => {
      prismaMock.client.create.mockResolvedValue({
        id: "client-2",
        tenantId: "tenant-1",
        name: "Construtora Ltda",
        kind: "COMPANY",
      });

      await createClient("tenant-1", {
        name: "Construtora Ltda",
        kind: "COMPANY",
        document: "11.222.333/0001-44",
        email: "contato@construtora.com",
        phone: "+55 63 3222-0000",
        notes: "Cliente premium",
      });

      expect(prismaMock.client.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          document: "11.222.333/0001-44",
          email: "contato@construtora.com",
          phone: "+55 63 3222-0000",
          notes: "Cliente premium",
        }),
      });
    });
  });

  describe("updateClient", () => {
    it("atualiza nome sem alterar outros campos", async () => {
      prismaMock.client.update.mockResolvedValue({
        id: "client-1",
        tenantId: "tenant-1",
        name: "Nome Atualizado",
      });

      const result = await updateClient("tenant-1", "client-1", {
        name: "Nome Atualizado",
      });

      expect(result.name).toBe("Nome Atualizado");
      expect(prismaMock.client.update).toHaveBeenCalledWith({
        where: { tenantId_id: { tenantId: "tenant-1", id: "client-1" } },
        data: { name: "Nome Atualizado" },
      });
    });

    it("limpa campos opcionais quando null é passado", async () => {
      prismaMock.client.update.mockResolvedValue({
        id: "client-1",
        tenantId: "tenant-1",
        name: "Cliente",
      });

      await updateClient("tenant-1", "client-1", {
        name: "Cliente",
        document: null,
        email: null,
        phone: null,
        notes: null,
      });

      expect(prismaMock.client.update).toHaveBeenCalledWith({
        where: { tenantId_id: { tenantId: "tenant-1", id: "client-1" } },
        data: {
          name: "Cliente",
          document: null,
          email: null,
          phone: null,
          notes: null,
        },
      });
    });

    it("não envia campos não informados no update", async () => {
      prismaMock.client.update.mockResolvedValue({
        id: "client-1",
        tenantId: "tenant-1",
        name: "Cliente",
      });

      await updateClient("tenant-1", "client-1", {
        name: "Cliente",
      });

      const callData = prismaMock.client.update.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty("kind");
      expect(callData).not.toHaveProperty("document");
      expect(callData).not.toHaveProperty("email");
      expect(callData).not.toHaveProperty("phone");
      expect(callData).not.toHaveProperty("notes");
    });

    it("atualiza email com string vazia para null", async () => {
      prismaMock.client.update.mockResolvedValue({
        id: "client-1",
        tenantId: "tenant-1",
        name: "Cliente",
        email: null,
      });

      await updateClient("tenant-1", "client-1", {
        name: "Cliente",
        email: "",
      });

      expect(prismaMock.client.update).toHaveBeenCalledWith({
        where: { tenantId_id: { tenantId: "tenant-1", id: "client-1" } },
        data: { name: "Cliente", email: null },
      });
    });
  });

  describe("getClientDetail", () => {
    it("retorna cliente com imóveis e serviços", async () => {
      const mockClient = {
        id: "client-1",
        name: "João",
        kind: "PERSON",
        document: null,
        email: null,
        phone: null,
        notes: null,
        properties: [],
        services: [],
      };
      prismaMock.client.findUnique.mockResolvedValue(mockClient);

      const result = await getClientDetail("tenant-1", "client-1");

      expect(result).toEqual(mockClient);
      expect(prismaMock.client.findUnique).toHaveBeenCalledWith({
        where: { tenantId_id: { tenantId: "tenant-1", id: "client-1" } },
        include: {
          properties: {
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { services: true } } },
          },
          services: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
    });
  });
});
