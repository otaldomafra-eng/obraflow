import { describe, expect, it } from "vitest";
import {
  CONTRACT_STATUSES,
  createContractSchema,
  updateContractSchema,
} from "@/features/contracts/actions";

describe("contract schema validation", () => {
  it("validates create input with required serviceId only", () => {
    const result = createContractSchema.parse({ serviceId: "svc-1" });
    expect(result.serviceId).toBe("svc-1");
    expect(result.status).toBeUndefined();
  });

  it("accepts optional proposalId", () => {
    const result = createContractSchema.parse({
      serviceId: "svc-1",
      proposalId: "prop-1",
    });
    expect(result.proposalId).toBe("prop-1");
  });

  it("accepts valid statuses", () => {
    for (const status of CONTRACT_STATUSES) {
      const result = createContractSchema.parse({ serviceId: "svc-1", status });
      expect(result.status).toBe(status);
    }
  });

  it("rejects invalid status", () => {
    expect(() =>
      createContractSchema.parse({ serviceId: "svc-1", status: "INVALID" }),
    ).toThrow();
  });

  it("rejects unknown fields on create", () => {
    expect(() =>
      createContractSchema.parse({ serviceId: "svc-1", title: "invalido" }),
    ).toThrow();
  });

  it("update accepts status only", () => {
    const result = updateContractSchema.parse({ status: "SIGNED" });
    expect(result.status).toBe("SIGNED");
  });

  it("update rejects empty object (nothing to update)", () => {
    const result = updateContractSchema.parse({});
    expect(result).toEqual({});
  });

  it("update rejects number changes", () => {
    expect(() => updateContractSchema.parse({ number: "CT-99999" })).toThrow();
  });

  it("update rejects service/proposal reassignment", () => {
    expect(() => updateContractSchema.parse({ serviceId: "svc-2" })).toThrow();
    expect(() => updateContractSchema.parse({ proposalId: "prop-2" })).toThrow();
  });

  it("update rejects title", () => {
    expect(() => updateContractSchema.parse({ title: "qualquer" })).toThrow();
  });
});
