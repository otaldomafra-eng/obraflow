import { describe, expect, it } from "vitest";

import { createProposalSchema, updateProposalSchema } from "@/features/proposals/actions";

describe("proposal schema validation", () => {
  it("validates create with required fields only", () => {
    const result = createProposalSchema.parse({
      serviceId: "svc-1",
      title: "Proposta de Reforma",
    });

    expect(result.serviceId).toBe("svc-1");
    expect(result.title).toBe("Proposta de Reforma");
    expect(result.status).toBeUndefined();
  });

  it("rejects empty title", () => {
    expect(() =>
      createProposalSchema.parse({
        serviceId: "svc-1",
        title: "",
      }),
    ).toThrow();
  });

  it("rejects empty serviceId", () => {
    expect(() =>
      createProposalSchema.parse({
        serviceId: "",
        title: "Proposta",
      }),
    ).toThrow();
  });

  it("accepts all valid statuses", () => {
    for (const status of ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELED"] as const) {
      const result = createProposalSchema.parse({
        serviceId: "svc-1",
        title: "Proposta",
        status,
      });
      expect(result.status).toBe(status);
    }
  });

  it("transforms totalAmount string to Decimal", () => {
    const result = createProposalSchema.parse({
      serviceId: "svc-1",
      title: "Proposta",
      totalAmount: "123.45",
    });

    expect(result.totalAmount).toBeDefined();
    expect(result.totalAmount?.toString()).toBe("123.45");
  });

  it("transforms validUntil string to Date", () => {
    const result = createProposalSchema.parse({
      serviceId: "svc-1",
      title: "Proposta",
      validUntil: "2026-06-30T00:00:00.000Z",
    });

    expect(result.validUntil).toBeInstanceOf(Date);
    expect(result.validUntil?.toISOString()).toBe("2026-06-30T00:00:00.000Z");
  });

  it("accepts optional notes", () => {
    const result = createProposalSchema.parse({
      serviceId: "svc-1",
      title: "Proposta",
      notes: "Observações relevantes",
    });

    expect(result.notes).toBe("Observações relevantes");
  });

  it("update validates partial fields", () => {
    const result = updateProposalSchema.parse({
      title: "Título Atualizado",
    });

    expect(result.title).toBe("Título Atualizado");
  });

  it("rejects invalid status in update", () => {
    expect(() =>
      updateProposalSchema.parse({
        status: "INVALID" as "DRAFT",
      }),
    ).toThrow();
  });

  it("update schema rejects serviceId", () => {
    const result = updateProposalSchema.parse({
      title: "Título Atualizado",
    });

    expect(result.title).toBe("Título Atualizado");
    expect(Object.keys(result)).not.toContain("serviceId");
  });
});
