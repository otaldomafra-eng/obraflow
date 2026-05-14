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

import { authOptions } from "@/server/auth/config";

const credentialsProvider = authOptions.providers[0] as {
  options: {
    authorize: (
      credentials: Record<"email" | "password", string>,
    ) => unknown | Promise<unknown>;
  };
};

describe("authOptions credentials provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows demo credentials outside development only when explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_LOGIN_ENABLED", "true");
    vi.stubEnv("DEMO_LOGIN_PASSWORD", "obraflow123");
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "admin@obraflow.local",
      name: "Admin ObraFlow",
    });

    await expect(
      Promise.resolve(credentialsProvider.options.authorize({
        email: "admin@obraflow.local",
        password: "obraflow123",
      })),
    ).resolves.toMatchObject({
      id: "user-1",
      email: "admin@obraflow.local",
      name: "Admin ObraFlow",
    });
  });

  it("keeps demo credentials disabled in production by default", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_LOGIN_PASSWORD", "obraflow123");

    await expect(
      Promise.resolve(credentialsProvider.options.authorize({
        email: "admin@obraflow.local",
        password: "obraflow123",
      })),
    ).resolves.toBeNull();

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});
