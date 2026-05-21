import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
    membership: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/auth/password", () => ({
  verifyPassword: vi.fn(),
}));

import { verifyPassword } from "@/server/auth/password";
import { authOptions } from "@/server/auth/config";

const mockedVerify = vi.mocked(verifyPassword);

const credentialsProvider = authOptions.providers[0] as {
  options: {
    authorize: (
      credentials: Record<"email" | "password", string>,
    ) => unknown | Promise<unknown>;
  };
};

const mockUser = (overrides?: Record<string, unknown>) => ({
  id: "user-1",
  email: "admin@obraflow.local",
  name: "Admin ObraFlow",
  passwordHash: null,
  ...overrides,
});

describe("authOptions credentials provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("passwordHash login", () => {
    it("allows login with correct password hash", async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        mockUser({ passwordHash: "$2b$10$hashedvalue" }),
      );
      mockedVerify.mockResolvedValue(true);

      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "admin@obraflow.local",
            password: "correct-password",
          }),
        ),
      ).resolves.toMatchObject({
        id: "user-1",
        email: "admin@obraflow.local",
        name: "Admin ObraFlow",
      });
    });

    it("rejects login with incorrect password hash", async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        mockUser({ passwordHash: "$2b$10$hashedvalue" }),
      );
      mockedVerify.mockResolvedValue(false);

      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "admin@obraflow.local",
            password: "wrong-password",
          }),
        ),
      ).resolves.toBeNull();
    });
  });

  describe("hash fallback to demo in dev/test", () => {
    it("falls back to demo login when passwordHash is present but wrong in development", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DEMO_LOGIN_PASSWORD", "obraflow123");
      prismaMock.user.findUnique.mockResolvedValue(
        mockUser({ passwordHash: "$2b$10$hashedvalue" }),
      );
      mockedVerify.mockResolvedValue(false);

      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "admin@obraflow.local",
            password: "obraflow123",
          }),
        ),
      ).resolves.toMatchObject({
        id: "user-1",
        email: "admin@obraflow.local",
        name: "Admin ObraFlow",
      });
    });

    it("does NOT fall back to demo in production when passwordHash is wrong", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEMO_LOGIN_PASSWORD", "obraflow123");
      prismaMock.user.findUnique.mockResolvedValue(
        mockUser({ passwordHash: "$2b$10$hashedvalue" }),
      );
      mockedVerify.mockResolvedValue(false);

      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "admin@obraflow.local",
            password: "obraflow123",
          }),
        ),
      ).resolves.toBeNull();
    });

    it("returns null when passwordHash is wrong, DEMO_LOGIN_PASSWORD is unset, in dev", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DEMO_LOGIN_PASSWORD", "");
      prismaMock.user.findUnique.mockResolvedValue(
        mockUser({ passwordHash: "$2b$10$hashedvalue" }),
      );
      mockedVerify.mockResolvedValue(false);

      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "admin@obraflow.local",
            password: "wrong",
          }),
        ),
      ).resolves.toBeNull();
    });
  });

  describe("demo fallback login", () => {
    it("allows demo login in development", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DEMO_LOGIN_PASSWORD", "obraflow123");
      prismaMock.user.findUnique.mockResolvedValue(
        mockUser({ passwordHash: null }),
      );

      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "admin@obraflow.local",
            password: "obraflow123",
          }),
        ),
      ).resolves.toMatchObject({
        id: "user-1",
        email: "admin@obraflow.local",
        name: "Admin ObraFlow",
      });
    });

    it("allows demo login in production when explicitly enabled", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEMO_LOGIN_ENABLED", "true");
      vi.stubEnv("DEMO_LOGIN_PASSWORD", "obraflow123");
      prismaMock.user.findUnique.mockResolvedValue(
        mockUser({ passwordHash: null }),
      );

      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "admin@obraflow.local",
            password: "obraflow123",
          }),
        ),
      ).resolves.toMatchObject({
        id: "user-1",
        email: "admin@obraflow.local",
        name: "Admin ObraFlow",
      });
    });

    it("rejects demo login in production when not enabled", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEMO_LOGIN_PASSWORD", "obraflow123");
      prismaMock.user.findUnique.mockResolvedValue(
        mockUser({ passwordHash: null }),
      );

      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "admin@obraflow.local",
            password: "obraflow123",
          }),
        ),
      ).resolves.toBeNull();
    });
  });

  describe("edge cases", () => {
    it("rejects when email is missing", async () => {
      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "",
            password: "any",
          }),
        ),
      ).resolves.toBeNull();
    });

    it("rejects when password is missing", async () => {
      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "admin@obraflow.local",
            password: "",
          }),
        ),
      ).resolves.toBeNull();
    });

    it("rejects when user is not found", async () => {
      vi.stubEnv("NODE_ENV", "development");
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        Promise.resolve(
          credentialsProvider.options.authorize({
            email: "unknown@obraflow.local",
            password: "any",
          }),
        ),
      ).resolves.toBeNull();
    });
  });
});
