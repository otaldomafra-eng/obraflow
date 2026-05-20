import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("hashPassword", () => {
  it("returns a hash different from the input", async () => {
    const password = "my-secret-password";
    const result = await hashPassword(password);

    expect(result).not.toBe(password);
    expect(result).toContain("$2");
  });

  it("produces different hashes for the same input (due to salt)", async () => {
    const password = "same-password";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for the correct password", async () => {
    const password = "correct-password";
    const hashed = await hashPassword(password);

    const result = await verifyPassword(password, hashed);

    expect(result).toBe(true);
  });

  it("returns false for an incorrect password", async () => {
    const password = "correct-password";
    const hashed = await hashPassword(password);

    const result = await verifyPassword("wrong-password", hashed);

    expect(result).toBe(false);
  });
});
