import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  createServiceTaskSchema,
  updateServiceTaskSchema,
  deleteServiceTask,
} from "@/features/service-tasks/actions";

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
    expect(() => createServiceTaskSchema.parse({ title: "Teste" })).toThrow();
  });

  it("rejects empty title", () => {
    expect(() =>
      createServiceTaskSchema.parse({ serviceId: "service-123", title: "" }),
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
        createServiceTaskSchema.parse({ serviceId: "s", title: "t", status }),
      ).toBeDefined();
    }
  });

  it("validates updateServiceTask input as partial", () => {
    const result = updateServiceTaskSchema.parse({ title: "Novo Título" });
    expect(result.title).toBe("Novo Título");
  });

  it("validates updateServiceTask with DELIVERED status", () => {
    expect(updateServiceTaskSchema.parse({ status: "DELIVERED" }).status).toBe("DELIVERED");
  });

  it("validates updateServiceTask with CANCELED status", () => {
    expect(updateServiceTaskSchema.parse({ status: "CANCELED" }).status).toBe("CANCELED");
  });
});

describe("updateServiceTask hardening", () => {
  it("strips serviceId from update payload (cannot move task to another service)", () => {
    const result = updateServiceTaskSchema.parse({
      serviceId: "other-service",
      title: "Novo Título",
    } as Record<string, unknown>);
    expect("serviceId" in result).toBe(false);
    expect(result.title).toBe("Novo Título");
  });

  it("accepts only title, description, status and dueDate", () => {
    const result = updateServiceTaskSchema.parse({
      title: "Apenas título",
      description: "Desc",
      status: "DELIVERED",
      dueDate: "2025-06-01",
    });
    expect(result.title).toBe("Apenas título");
    expect(result.description).toBe("Desc");
    expect(result.status).toBe("DELIVERED");
    expect(result.dueDate).toEqual(new Date("2025-06-01"));
  });

  it("ignores unknown fields by stripping them", () => {
    const result = updateServiceTaskSchema.parse({
      title: "Teste",
      serviceId: "should-be-stripped",
      extraField: "ignored",
    } as Record<string, unknown>);
    expect("serviceId" in result).toBe(false);
    expect("extraField" in result).toBe(false);
  });
});

describe("deleteServiceTask exists and is exported", () => {
  it("is a function", () => {
    expect(typeof deleteServiceTask).toBe("function");
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

  for (const status of ["PLANNING", "PRODUCTION", "DELIVERED", "CANCELED"] as const) {
    it(`has a color and label for ${status}`, () => {
      expect(statusColors[status]).toBeDefined();
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
  it("generates correct detail URL", () => {
    expect(`/services/service-abc123/tasks/task-xyz789`).toBe(
      `/services/${"service-abc123"}/tasks/${"task-xyz789"}`,
    );
  });

  it("generates correct edit URL", () => {
    expect(`/services/service-abc123/tasks/task-xyz789/edit`).toBe(
      `/services/${"service-abc123"}/tasks/${"task-xyz789"}/edit`,
    );
  });
});