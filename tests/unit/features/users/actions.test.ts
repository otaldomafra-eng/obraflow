import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    membership: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const { authMocks } = vi.hoisted(() => ({
  authMocks: {
    getServerSession: vi.fn(),
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/auth/password", () => ({
  hashPassword: authMocks.hashPassword,
  verifyPassword: authMocks.verifyPassword,
}));

vi.mock("next-auth", () => ({
  getServerSession: authMocks.getServerSession,
}));

vi.mock("@/server/auth/config", () => ({
  authOptions: {},
}));

import { changePassword, createUser, listUsers, removeUser, updateUserRole } from "@/features/users/actions";

describe("user actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  describe("changePassword", () => {
    it("muda senha quando currentPassword está correta", async () => {
      authMocks.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
      prismaMock.user.findUnique.mockResolvedValue({ passwordHash: "$2a$10$oldhash" });
      authMocks.verifyPassword.mockImplementation(async (pw: string) => pw === "current123");
      authMocks.hashPassword.mockResolvedValue("$2a$10$newhash");

      await changePassword("tenant-1", {
        currentPassword: "current123",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { passwordHash: "$2a$10$newhash" },
      });
    });

    it("rejeita quando currentPassword está incorreta", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ passwordHash: "$2a$10$oldhash" });
      authMocks.verifyPassword.mockResolvedValue(false);

      await expect(
        changePassword("tenant-1", {
          currentPassword: "wrong",
          newPassword: "newpass123",
          confirmPassword: "newpass123",
        }),
      ).rejects.toThrow("Senha atual incorreta");
    });

    it("rejeita quando newPassword igual à atual", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ passwordHash: "$2a$10$hash" });
      authMocks.verifyPassword.mockImplementation(async (pw: string) => pw === "current123");
      authMocks.hashPassword.mockResolvedValue("$2a$10$hash");

      await expect(
        changePassword("tenant-1", {
          currentPassword: "current123",
          newPassword: "current123",
          confirmPassword: "current123",
        }),
      ).rejects.toThrow("Nova senha deve ser diferente da atual");
    });

    it("define senha quando usuário não tem passwordHash", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ passwordHash: null });
      authMocks.hashPassword.mockResolvedValue("$2a$10$newhash");

      await changePassword("tenant-1", {
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { passwordHash: "$2a$10$newhash" },
      });
    });

    it("rejeita quando currentPassword não informada mas user tem hash", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ passwordHash: "$2a$10$hash" });

      await expect(
        changePassword("tenant-1", {
          newPassword: "newpass123",
          confirmPassword: "newpass123",
        }),
      ).rejects.toThrow("Senha atual é obrigatória");
    });

    it("rejeita quando senhas não conferem (schema zod)", async () => {
      await expect(
        changePassword("tenant-1", {
          currentPassword: "current123",
          newPassword: "newpass123",
          confirmPassword: "different",
        }),
      ).rejects.toThrow("Confirmação não confere");
    });
  });

  describe("createUser", () => {
    const validInput = {
      name: "Novo Usuário",
      email: "novo@email.com",
      role: "MANAGER" as const,
      password: "senha1234",
      confirmPassword: "senha1234",
    };

    it("cria usuário novo com email", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "ADMIN" });
      prismaMock.user.findUnique.mockResolvedValue(null);
      authMocks.hashPassword.mockResolvedValue("$2a$10$hashed");
      prismaMock.user.create.mockResolvedValue({ id: "new-user" });
      prismaMock.membership.create.mockResolvedValue({});

      const result = await createUser("tenant-1", "user-1", validInput);

      expect(result).toEqual({ id: "new-user" });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: "Novo Usuário",
          email: "novo@email.com",
          passwordHash: "$2a$10$hashed",
        },
      });
      expect(prismaMock.membership.create).toHaveBeenCalledWith({
        data: { tenantId: "tenant-1", userId: "new-user", role: "MANAGER" },
      });
    });

    it("normaliza email para lowercase", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "ADMIN" });
      prismaMock.user.findUnique.mockResolvedValue(null);
      authMocks.hashPassword.mockResolvedValue("hash");
      prismaMock.user.create.mockResolvedValue({ id: "new-user" });
      prismaMock.membership.create.mockResolvedValue({});

      await createUser("tenant-1", "user-1", {
        ...validInput,
        email: "NOVO@EMAIL.COM",
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: "novo@email.com" }),
        }),
      );
    });

    it("rejeita quando caller não é ADMIN", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "MANAGER" });

      await expect(createUser("tenant-1", "user-1", validInput)).rejects.toThrow(
        "Apenas administradores podem criar usuários",
      );
    });

    it("rejeita quando email já existe no mesmo tenant", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "ADMIN" });
      prismaMock.user.findUnique.mockResolvedValue({ id: "existing-user" });
      prismaMock.membership.findUnique
        .mockResolvedValueOnce({ role: "ADMIN" })
        .mockResolvedValueOnce({ role: "INTERNAL_TEAM" });

      await expect(createUser("tenant-1", "user-1", validInput)).rejects.toThrow(
        "Este email já está cadastrado neste tenant",
      );
    });

    it("reusa usuário existente quando email já existe em outro tenant", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "ADMIN" });
      prismaMock.user.findUnique.mockResolvedValue({ id: "existing-user" });
      prismaMock.membership.findUnique
        .mockResolvedValueOnce({ role: "ADMIN" })
        .mockResolvedValueOnce(null);
      authMocks.hashPassword.mockResolvedValue("hash");

      await createUser("tenant-1", "user-1", validInput);

      expect(prismaMock.membership.create).toHaveBeenCalledWith({
        data: { tenantId: "tenant-1", userId: "existing-user", role: "MANAGER" },
      });
    });

    it("rejeita quando senhas não conferem (zod)", async () => {
      await expect(
        createUser("tenant-1", "user-1", {
          ...validInput,
          confirmPassword: "different",
        }),
      ).rejects.toThrow("Confirmação não confere");
    });
  });

  describe("updateUserRole", () => {
    it("altera cargo de usuário", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "ADMIN" });
      prismaMock.membership.count.mockResolvedValue(2);
      prismaMock.membership.update.mockResolvedValue({
        tenantId: "tenant-1",
        userId: "target-user",
        role: "TECHNICIAN",
      });

      const result = await updateUserRole("tenant-1", "user-1", {
        userId: "target-user",
        role: "TECHNICIAN",
      });

      expect(result.role).toBe("TECHNICIAN");
      expect(prismaMock.membership.update).toHaveBeenCalledWith({
        where: { tenantId_userId: { tenantId: "tenant-1", userId: "target-user" } },
        data: { role: "TECHNICIAN" },
      });
    });

    it("impede remoção do último ADMIN", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "ADMIN" });
      prismaMock.membership.count.mockResolvedValue(1);

      await expect(
        updateUserRole("tenant-1", "user-1", {
          userId: "target-user",
          role: "MANAGER",
        }),
      ).rejects.toThrow("Não é possível remover o último administrador");
    });

    it("rejeita quando caller não é ADMIN", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "MANAGER" });

      await expect(
        updateUserRole("tenant-1", "user-1", {
          userId: "target-user",
          role: "MANAGER",
        }),
      ).rejects.toThrow("Apenas administradores podem alterar cargos");
    });
  });

  describe("removeUser", () => {
    it("remove usuário do tenant", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "ADMIN" });
      prismaMock.membership.count.mockResolvedValue(2);

      await removeUser("tenant-1", "user-1", "target-user");

      expect(prismaMock.membership.delete).toHaveBeenCalledWith({
        where: { tenantId_userId: { tenantId: "tenant-1", userId: "target-user" } },
      });
    });

    it("impede remoção do último ADMIN", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "ADMIN" });
      prismaMock.membership.count.mockResolvedValue(1);

      await expect(
        removeUser("tenant-1", "user-1", "target-user"),
      ).rejects.toThrow("Não é possível remover o último administrador");
    });

    it("rejeita quando caller não é ADMIN", async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: "MANAGER" });

      await expect(
        removeUser("tenant-1", "user-1", "target-user"),
      ).rejects.toThrow("Apenas administradores podem remover usuários");
    });

    it("rejeita quando usuário não encontrado no tenant", async () => {
      prismaMock.membership.findUnique.mockResolvedValueOnce({ role: "ADMIN" }).mockResolvedValueOnce(null);

      await expect(
        removeUser("tenant-1", "user-1", "nonexistent"),
      ).rejects.toThrow("Usuário não encontrado neste tenant");
    });
  });

  describe("listUsers", () => {
    it("lista membros do tenant", async () => {
      const mockMemberships = [
        {
          role: "ADMIN",
          createdAt: new Date("2024-01-01"),
          user: { id: "u1", name: "Admin", email: "admin@test.com", passwordHash: "hash", createdAt: new Date("2024-01-01") },
        },
      ];
      prismaMock.membership.findMany.mockResolvedValue(mockMemberships);

      const result = await listUsers("tenant-1");

      expect(result).toEqual(mockMemberships);
      expect(prismaMock.membership.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1" },
        select: {
          role: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, passwordHash: true, createdAt: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
