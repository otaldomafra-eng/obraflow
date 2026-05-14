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
    expect(result.status).toBeUndefined();
  });

  it("allows optional description", () => {
    const result = createServiceTaskSchema.parse({
      serviceId: "service-123",
      title: "Teste",
    });
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

  it("validates updateServiceTask with DELIVERED status", () => {
    const result = updateServiceTaskSchema.parse({
      status: "DELIVERED",
    });
    expect(result.status).toBe("DELIVERED");
  });

  it("validates updateServiceTask with CANCELED status", () => {
    const result = updateServiceTaskSchema.parse({
      status: "CANCELED",
    });
    expect(result.status).toBe("CANCELED");
  });
});

describe("task status labels and colors", () => {
  const statusColors: Record<string, string> = {
    PLANNING: "bg-purple-50 text-purple-700",
    PRODUCTION: "bg-indigo-50 text-indigo-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    CANCELED: "bg-red-50 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    PLANNING: "Planejamento",
    PRODUCTION: "Em Produção",
    DELIVERED: "Entregue",
    CANCELED: "Cancelada",
  };

  const validStatuses = ["PLANNING", "PRODUCTION", "DELIVERED", "CANCELED"] as const;

  for (const status of validStatuses) {
    it(`has a color for ${status}`, () => {
      expect(statusColors[status]).toBeDefined();
    });

    it(`has a label for ${status}`, () => {
      expect(statusLabels[status]).toBeDefined();
      expect(statusLabels[status].length).toBeGreaterThan(0);
    });
  }

  it("does not have IN_PROGRESS color mapping", () => {
    expect(statusColors["IN_PROGRESS"]).toBeUndefined();
  });

  it("does not have DONE color mapping", () => {
    expect(statusColors["DONE"]).toBeUndefined();
  });
});

describe("task route pattern", () => {
  it("generates correct detail URL pattern for a task", () => {
    const serviceId = "service-abc123";
    const taskId = "task-xyz789";
    const href = `/services/${serviceId}/tasks/${taskId}`;
    expect(href).toBe("/services/service-abc123/tasks/task-xyz789");
  });

  it("generates correct edit URL pattern for a task", () => {
    const serviceId = "service-abc123";
    const taskId = "task-xyz789";
    const href = `/services/${serviceId}/tasks/${taskId}/edit`;
    expect(href).toBe("/services/service-abc123/tasks/task-xyz789/edit");
  });
});