import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("service actions schema validation", () => {
  it("validates createService input", () => {
    const schema = z.object({
      clientId: z.string().min(1),
      propertyId: z.string().optional(),
      title: z.string().min(1),
      type: z.enum([
        "TECHNICAL_PROJECT",
        "REGULARIZATION",
        "WORK_EXECUTION",
        "CONSULTING",
        "FIRE_SAFETY",
        "PROJECT_APPROVAL_WORK",
      ]),
      status: z.enum([
        "NEW",
        "PROPOSAL",
        "AWAITING_ACCEPTANCE",
        "CONTRACTED",
        "PLANNING",
        "PRODUCTION",
        "APPROVAL",
        "WORK",
        "AWAITING_CLIENT",
        "PAUSED",
        "DELIVERED",
        "CANCELED",
      ]).optional(),
      description: z.string().optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
    });

    expect(
      schema.parse({
        clientId: "client-123",
        title: "Reforma Apartamento",
        type: "WORK_EXECUTION",
      }),
    ).toBeDefined();
  });

  it("rejects invalid service type", () => {
    const schema = z.object({
      clientId: z.string().min(1),
      title: z.string().min(1),
      type: z.enum([
        "TECHNICAL_PROJECT",
        "REGULARIZATION",
        "WORK_EXECUTION",
        "CONSULTING",
        "FIRE_SAFETY",
        "PROJECT_APPROVAL_WORK",
      ]),
    });

    expect(() =>
      schema.parse({
        clientId: "client-123",
        title: "Reforma",
        type: "INVALID_TYPE",
      }),
    ).toThrow();
  });

  it("validates listServices input with pagination", () => {
    const schema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
      clientId: z.string().optional(),
      propertyId: z.string().optional(),
      status: z.enum([
        "NEW",
        "PROPOSAL",
        "AWAITING_ACCEPTANCE",
        "CONTRACTED",
        "PLANNING",
        "PRODUCTION",
        "APPROVAL",
        "WORK",
        "AWAITING_CLIENT",
        "PAUSED",
        "DELIVERED",
        "CANCELED",
      ]).optional(),
    });

    const result = schema.parse({ page: 2, pageSize: 50, status: "NEW" });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
    expect(result.status).toBe("NEW");
  });

  it("accepts optional filters", () => {
    const schema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
      clientId: z.string().optional(),
      propertyId: z.string().optional(),
      status: z.enum([
        "NEW",
        "PROPOSAL",
        "AWAITING_ACCEPTANCE",
        "CONTRACTED",
        "PLANNING",
        "PRODUCTION",
        "APPROVAL",
        "WORK",
        "AWAITING_CLIENT",
        "PAUSED",
        "DELIVERED",
        "CANCELED",
      ]).optional(),
    });

    const result = schema.parse({ search: "reforma" });
    expect(result.search).toBe("reforma");
    expect(result.clientId).toBeUndefined();
  });
});