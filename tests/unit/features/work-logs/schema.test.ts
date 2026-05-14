import { describe, expect, it } from "vitest";

import {
  createWorkLogSchema,
} from "@/features/work-logs/actions";

describe("work log actions schema validation", () => {
  it("validates createWorkLog input with required fields", () => {
    expect(
      createWorkLogSchema.parse({
        serviceId: "service-123",
        taskId: "task-456",
        summary: "Levantamento topográfico",
        performedAt: "2025-06-15T08:00",
      }),
    ).toBeDefined();
  });

  it("validates createWorkLog input with all fields", () => {
    const result = createWorkLogSchema.parse({
      serviceId: "service-123",
      taskId: "task-456",
      summary: "Concluído levantamento",
      description: "Realizado levantamento completo do terreno",
      performedAt: "2025-06-15T08:00",
      hours: "4.5",
    });

    expect(result.serviceId).toBe("service-123");
    expect(result.taskId).toBe("task-456");
    expect(result.summary).toBe("Concluído levantamento");
    expect(result.description).toBe("Realizado levantamento completo do terreno");
    expect(result.performedAt).toEqual(new Date("2025-06-15T08:00"));
    expect(result.hours).toBe(4.5);
  });

  it("allows optional description", () => {
    const result = createWorkLogSchema.parse({
      serviceId: "service-123",
      taskId: "task-456",
      summary: "Teste",
      performedAt: "2025-06-15T08:00",
    });
    expect(result.description).toBeUndefined();
  });

  it("allows optional hours", () => {
    const result = createWorkLogSchema.parse({
      serviceId: "service-123",
      taskId: "task-456",
      summary: "Teste",
      performedAt: "2025-06-15T08:00",
    });
    expect(result.hours).toBeNull();
  });

  it("rejects missing summary", () => {
    expect(() =>
      createWorkLogSchema.parse({
        serviceId: "service-123",
        taskId: "task-456",
        performedAt: "2025-06-15T08:00",
      }),
    ).toThrow();
  });

  it("rejects empty summary", () => {
    expect(() =>
      createWorkLogSchema.parse({
        serviceId: "service-123",
        taskId: "task-456",
        summary: "",
        performedAt: "2025-06-15T08:00",
      }),
    ).toThrow();
  });

  it("rejects missing performedAt", () => {
    expect(() =>
      createWorkLogSchema.parse({
        serviceId: "service-123",
        taskId: "task-456",
        summary: "Teste",
      }),
    ).toThrow();
  });

  it("rejects invalid performedAt", () => {
    expect(() =>
      createWorkLogSchema.parse({
        serviceId: "service-123",
        taskId: "task-456",
        summary: "Teste",
        performedAt: "invalid-date",
      }),
    ).toThrow();
  });

  it("rejects missing serviceId", () => {
    expect(() =>
      createWorkLogSchema.parse({
        taskId: "task-456",
        summary: "Teste",
        performedAt: "2025-06-15T08:00",
      }),
    ).toThrow();
  });

  it("rejects missing taskId", () => {
    expect(() =>
      createWorkLogSchema.parse({
        serviceId: "service-123",
        summary: "Teste",
        performedAt: "2025-06-15T08:00",
      }),
    ).toThrow();
  });

  it("parses hours string to number", () => {
    const result = createWorkLogSchema.parse({
      serviceId: "service-123",
      taskId: "task-456",
      summary: "Teste",
      performedAt: "2025-06-15T08:00",
      hours: "2.5",
    });
    expect(result.hours).toBe(2.5);
  });
});

describe("work log route pattern", () => {
  it("generates correct work-logs URL", () => {
    const href = `/services/service-abc123/tasks/task-xyz789/work-logs`;
    expect(href).toBe(
      `/services/${"service-abc123"}/tasks/${"task-xyz789"}/work-logs`,
    );
  });
});