import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  createServiceSchema,
  listServicesSchema,
  updateServiceSchema,
} from "@/features/services/actions";

describe("service actions schema validation", () => {
  it("validates createService input with required fields", () => {
    expect(
      createServiceSchema.parse({
        clientId: "client-123",
        title: "Reforma Apartamento",
        type: "WORK_EXECUTION",
      }),
    ).toBeDefined();
  });

  it("validates createService input with optional fields", () => {
    const result = createServiceSchema.parse({
      clientId: "client-123",
      propertyId: "prop-456",
      title: "Reforma Completa",
      type: "TECHNICAL_PROJECT",
      status: "NEW",
      description: "Reforma do apartamento 101",
      startDate: "2025-01-01",
      dueDate: "2025-06-01",
    });

    expect(result.propertyId).toBe("prop-456");
    expect(result.status).toBe("NEW");
    expect(result.description).toBe("Reforma do apartamento 101");
    expect(result.startDate).toEqual(new Date("2025-01-01"));
    expect(result.dueDate).toEqual(new Date("2025-06-01"));
  });

  it("rejects invalid service type", () => {
    expect(() =>
      createServiceSchema.parse({
        clientId: "client-123",
        title: "Reforma",
        type: "INVALID_TYPE" as "TECHNICAL_PROJECT",
      }),
    ).toThrow();
  });

  it("rejects missing clientId", () => {
    expect(() =>
      createServiceSchema.parse({
        title: "Reforma",
        type: "WORK_EXECUTION",
      }),
    ).toThrow();
  });

  it("rejects empty clientId", () => {
    expect(() =>
      createServiceSchema.parse({
        clientId: "",
        title: "Reforma",
        type: "WORK_EXECUTION",
      }),
    ).toThrow();
  });

  it("allows optional propertyId", () => {
    const result = createServiceSchema.parse({
      clientId: "client-123",
      title: "Consultoria",
      type: "CONSULTING",
    });
    expect(result.propertyId).toBeUndefined();
  });

  it("defaults status to undefined when not provided", () => {
    const result = createServiceSchema.parse({
      clientId: "client-123",
      title: "Teste",
      type: "FIRE_SAFETY",
    });
    expect(result.status).toBeUndefined();
  });

  it("validates updateService input as partial", () => {
    const result = updateServiceSchema.parse({
      title: "Novo Título",
    });
    expect(result.title).toBe("Novo Título");
  });

  it("updateService accepts null for optional fields", () => {
    const result = updateServiceSchema.parse({
      description: null,
      startDate: null,
      dueDate: null,
    });
    expect(result.description).toBeNull();
    expect(result.startDate).toBeNull();
    expect(result.dueDate).toBeNull();
  });

  it("updateService rejects null for title", () => {
    expect(() =>
      updateServiceSchema.parse({ title: null }),
    ).toThrow();
  });

  it("updateService rejects null for clientId", () => {
    expect(() =>
      updateServiceSchema.parse({ clientId: null }),
    ).toThrow();
  });

  it("updateService startDate transforms null and empty string to null", () => {
    const withNull = updateServiceSchema.parse({ startDate: null });
    expect(withNull.startDate).toBeNull();

    const withEmpty = updateServiceSchema.parse({ startDate: "" });
    expect(withEmpty.startDate).toBeNull();
  });

  it("updateService startDate without input stays undefined", () => {
    const result = updateServiceSchema.parse({ title: "test" });
    expect(result.startDate).toBeUndefined();
  });

  it("validates listServices input with pagination", () => {
    const result = listServicesSchema.parse({ page: 2, pageSize: 50, status: "NEW" });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
    expect(result.status).toBe("NEW");
  });

  it("validates listServices input with search", () => {
    const result = listServicesSchema.parse({ search: "reforma" });
    expect(result.search).toBe("reforma");
    expect(result.clientId).toBeUndefined();
  });

  it("uses default pagination values", () => {
    const result = listServicesSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("accepts all valid service types", () => {
    const types: Array<z.input<typeof createServiceSchema>["type"]> = [
      "TECHNICAL_PROJECT",
      "REGULARIZATION",
      "WORK_EXECUTION",
      "CONSULTING",
      "FIRE_SAFETY",
      "PROJECT_APPROVAL_WORK",
    ];

    for (const type of types) {
      expect(
        createServiceSchema.parse({
          clientId: "client-123",
          title: "Teste",
          type,
        }),
      ).toBeDefined();
    }
  });

  it("rejects invalid status values", () => {
    expect(() =>
      createServiceSchema.parse({
        clientId: "client-123",
        title: "Teste",
        type: "WORK_EXECUTION",
        status: "INVALID_STATUS" as "NEW",
      }),
    ).toThrow();
  });
});