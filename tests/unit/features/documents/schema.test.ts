import { describe, expect, it } from "vitest";

import {
  createDocumentSchema,
  updateDocumentSchema,
} from "@/features/documents/actions";

describe("createDocumentSchema", () => {
  it("validates create with required fields only", () => {
    const result = createDocumentSchema.safeParse({
      serviceId: "svc-1",
      title: "Documento",
      url: "https://example.com/doc.pdf",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.serviceId).toBe("svc-1");
      expect(result.data.title).toBe("Documento");
      expect(result.data.url).toBe("https://example.com/doc.pdf");
      expect(result.data.visibility).toBeUndefined();
    }
  });

  it("rejects empty title", () => {
    const result = createDocumentSchema.safeParse({
      serviceId: "svc-1",
      title: "",
      url: "https://example.com/doc.pdf",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty url", () => {
    const result = createDocumentSchema.safeParse({
      serviceId: "svc-1",
      title: "Documento",
      url: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts optional proposalId", () => {
    const result = createDocumentSchema.safeParse({
      serviceId: "svc-1",
      proposalId: "prop-1",
      title: "Documento",
      url: "https://example.com/doc.pdf",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.proposalId).toBe("prop-1");
    }
  });

  it("accepts all valid visibilities", () => {
    for (const visibility of ["INTERNAL", "CLIENT_VISIBLE", "SUPPLIER_VISIBLE"]) {
      const result = createDocumentSchema.safeParse({
        serviceId: "svc-1",
        title: "Documento",
        url: "https://example.com/doc.pdf",
        visibility,
      });

      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid visibility", () => {
    const result = createDocumentSchema.safeParse({
      serviceId: "svc-1",
      title: "Documento",
      url: "https://example.com/doc.pdf",
      visibility: "INVALID",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateDocumentSchema", () => {
  it("validates partial fields", () => {
    const result = updateDocumentSchema.safeParse({
      title: "Título Atualizado",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Título Atualizado");
      expect(result.data.url).toBeUndefined();
    }
  });
});
