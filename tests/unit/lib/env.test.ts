import { afterEach, describe, expect, it, vi } from "vitest";

import { getRequiredEnvs, requireEnv } from "@/lib/env";

describe("requireEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the value when the env var is set", () => {
    vi.stubEnv("MY_VAR", "hello");

    expect(requireEnv("MY_VAR")).toBe("hello");
  });

  it("throws when the env var is missing", () => {
    vi.unstubAllEnvs();

    expect(() => requireEnv("MISSING_VAR")).toThrow(
      "Missing required environment variable: MISSING_VAR",
    );
  });
});

describe("getRequiredEnvs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns all required envs when set", () => {
    vi.stubEnv("DATABASE_URL", "postgres://localhost/db");
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    vi.stubEnv("NEXTAUTH_SECRET", "secret123");

    const result = getRequiredEnvs();

    expect(result).toEqual({
      databaseUrl: "postgres://localhost/db",
      nextAuthUrl: "http://localhost:3000",
      nextAuthSecret: "secret123",
    });
  });

  it("throws when DATABASE_URL is missing", () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    vi.stubEnv("NEXTAUTH_SECRET", "secret123");

    expect(() => getRequiredEnvs()).toThrow("DATABASE_URL");
  });
});
