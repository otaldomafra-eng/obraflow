import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    membership: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

const { hashPassword: mockHash } = vi.hoisted(() => ({
  hashPassword: vi.fn().mockResolvedValue("$2b$10$mockedhash"),
}));

vi.mock("@/server/auth/password", () => ({
  hashPassword: mockHash,
}));

import { setupFirstAdmin } from "@/features/setup/actions";

describe("setupFirstAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates tenant, user and membership when no admin exists", async () => {
    prismaMock.membership.findFirst.mockResolvedValue(null);
    prismaMock.tenant.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.tenant.create.mockResolvedValue({
      id: "tenant-1",
      name: "Meu Escritório",
      slug: "meu-escritorio",
    });
    prismaMock.user.create.mockResolvedValue({
      id: "user-1",
      name: "Admin",
      email: "admin@test.com",
    });

    const result = await setupFirstAdmin({
      name: "Admin",
      email: "admin@test.com",
      password: "password123",
      tenantName: "Meu Escritório",
      tenantSlug: "meu-escritorio",
    });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.tenant.create).toHaveBeenCalledWith({
      data: { name: "Meu Escritório", slug: "meu-escritorio" },
    });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        name: "Admin",
        email: "admin@test.com",
        passwordHash: "$2b$10$mockedhash",
      },
    });
    expect(prismaMock.membership.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        userId: "user-1",
        role: "ADMIN",
      },
    });
  });

  it("rejects when admin already exists", async () => {
    prismaMock.membership.findFirst.mockResolvedValue({ id: "membership-1" });

    const result = await setupFirstAdmin({
      name: "Admin",
      email: "admin@test.com",
      password: "password123",
      tenantName: "Escritório",
      tenantSlug: "escritorio",
    });

    expect(result).toEqual({
      ok: false,
      error: "Já existe um administrador configurado",
    });
  });

  it("rejects when tenant slug is taken", async () => {
    prismaMock.membership.findFirst.mockResolvedValue(null);
    prismaMock.tenant.findUnique.mockResolvedValue({ id: "existing-tenant" });

    const result = await setupFirstAdmin({
      name: "Admin",
      email: "admin@test.com",
      password: "password123",
      tenantName: "Escritório",
      tenantSlug: "escritorio",
    });

    expect(result).toEqual({
      ok: false,
      error: "Este slug de escritório já está em uso",
    });
  });

  it("rejects when email is already in use", async () => {
    prismaMock.membership.findFirst.mockResolvedValue(null);
    prismaMock.tenant.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing-user" });

    const result = await setupFirstAdmin({
      name: "Admin",
      email: "existing@test.com",
      password: "password123",
      tenantName: "Escritório",
      tenantSlug: "escritorio",
    });

    expect(result).toEqual({
      ok: false,
      error: "Este email já está em uso",
    });
  });

  it("rejects short passwords", async () => {
    const result = await setupFirstAdmin({
      name: "Admin",
      email: "admin@test.com",
      password: "short",
      tenantName: "Escritório",
      tenantSlug: "escritorio",
    });

    expect(result).toEqual({
      ok: false,
      error: "Senha deve ter no mínimo 8 caracteres",
    });
  });

  it("rejects invalid email", async () => {
    const result = await setupFirstAdmin({
      name: "Admin",
      email: "not-an-email",
      password: "password123",
      tenantName: "Escritório",
      tenantSlug: "escritorio",
    });

    expect(result).toEqual({
      ok: false,
      error: "Email inválido",
    });
  });

  it("rejects invalid slug characters", async () => {
    const result = await setupFirstAdmin({
      name: "Admin",
      email: "admin@test.com",
      password: "password123",
      tenantName: "Escritório",
      tenantSlug: "Meu Escritório",
    });

    expect(result).toEqual({
      ok: false,
      error:
        "Slug deve conter apenas letras minúsculas, números e hífens",
    });
  });
});
