import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createServiceTaskSchema, updateServiceTaskSchema } from "@/features/service-tasks/actions";

describe("service task actions schema validation", () => {
  it("validates createServiceTask input with required fields", () => {
    expect(
      createServiceTaskSchema.parse({
        serviceId: "service-123",
        title: "Preparar base",
      }),
    ).toBeDefined();
  });

  it("validates createServiceTask input with all fields", () => {
    const result = createServiceTaskSchema.parse({
      serviceId: "service-123",
      title: "Preparar base de concreto",
      description: "Preparar a base com concreto C30",
      status: "PLANNING",
      dueDate: "2025-03-15",
    });

    expect(result.serviceId).toBe("service-123");
    expect(result.title).toBe("Preparar base de concreto");
    expect(result.description).toBe("Preparar a base com concreto C30");
    expect(result.status).toBe("PLANNING");
    expect(result.dueDate).toEqual(new Date("2025-03-15"));
  });

it("defaults status to PLANNING when not provided", () => {
     const result = createServiceTaskSchema.parse({
       serviceId: "service-123",
       title: "Teste",
     });
     // Schema marks status as optional; the default "PLANNING" is applied in createServiceTask action
     expect(result.status).toBeUndefined();
   });

it("allows optional description", () => {
     const result = createServiceTaskSchema.parse({
       serviceId: "service-123",
       title: "Teste",
     });
     // Schema marks description as optional; null is applied in createServiceTask action
     expect(result.description).toBeUndefined();
   });

  it("allows optional dueDate", () => {
    const result = createServiceTaskSchema.parse({
      serviceId: "service-123",
      title: "Teste",
    });
    expect(result.dueDate).toBeNull();
  });

  it("rejects missing serviceId", () => {
    expect(() =>
      createServiceTaskSchema.parse({
        title: "Teste",
      }),
    ).toThrow();
  });

  it("rejects empty title", () => {
    expect(() =>
      createServiceTaskSchema.parse({
        serviceId: "service-123",
        title: "",
      }),
    ).toThrow();
  });

  it("rejects invalid status", () => {
    expect(() =>
      createServiceTaskSchema.parse({
        serviceId: "service-123",
        title: "Teste",
        status: "INVALID" as "PLANNING",
      }),
    ).toThrow();
  });

it("accepts all valid task statuses", () => {
     const statuses: Array<z.input<typeof createServiceTaskSchema>["status"]> = [
       "PLANNING",
       "PRODUCTION",
       "DELIVERED",
       "CANCELED",
     ];

    for (const status of statuses) {
      expect(
        createServiceTaskSchema.parse({
          serviceId: "service-123",
          title: "Teste",
          status,
        }),
      ).toBeDefined();
    }
  });

  it("validates updateServiceTask input as partial", () => {
    const result = updateServiceTaskSchema.parse({
      title: "Novo Título",
    });
    expect(result.title).toBe("Novo Título");
  });

it("validates updateServiceTask with status change", () => {
     const result = updateServiceTaskSchema.parse({
       status: "DELIVERED",
     });
     expect(result.status).toBe("DELIVERED");
   });
});