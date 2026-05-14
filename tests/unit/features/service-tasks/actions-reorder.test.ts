import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    serviceTask: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    service: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { reorderServiceTasks } from "@/features/service-tasks/actions";

describe("reorderServiceTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates sortOrder for each taskId in order", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "service-1" });
    prismaMock.serviceTask.findMany.mockResolvedValue([
      { id: "task-a" },
      { id: "task-b" },
      { id: "task-c" },
    ]);
    prismaMock.$transaction.mockImplementation(async (updates) => {
      for (const update of updates) {
        await update;
      }
    });

    await reorderServiceTasks("tenant-1", "service-1", [
      "task-c",
      "task-a",
      "task-b",
    ]);

    expect(prismaMock.serviceTask.update).toHaveBeenCalledTimes(3);
    expect(prismaMock.serviceTask.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "task-c" } },
      data: { sortOrder: 0 },
    });
    expect(prismaMock.serviceTask.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "task-a" } },
      data: { sortOrder: 1 },
    });
    expect(prismaMock.serviceTask.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "task-b" } },
      data: { sortOrder: 2 },
    });
  });

  it("rejects when task list is incomplete (partial list)", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "service-1" });
    prismaMock.serviceTask.findMany.mockResolvedValue([
      { id: "task-a" },
      { id: "task-b" },
      { id: "task-c" },
    ]);

    await expect(
      reorderServiceTasks("tenant-1", "service-1", ["task-a", "task-b"]),
    ).rejects.toThrow(/Expected 3 tasks, got 2/);

    expect(prismaMock.serviceTask.update).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects when task list contains duplicate IDs", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "service-1" });
    prismaMock.serviceTask.findMany.mockResolvedValue([
      { id: "task-a" },
      { id: "task-b" },
    ]);

    await expect(
      reorderServiceTasks("tenant-1", "service-1", ["task-a", "task-a"]),
    ).rejects.toThrow(/Duplicate task IDs/);

    expect(prismaMock.serviceTask.update).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects when service does not belong to tenant", async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);

    await expect(
      reorderServiceTasks("tenant-1", "service-1", ["task-a", "task-b"]),
    ).rejects.toThrow(/Service.*does not belong/);
  });

  it("rejects when task list contains foreign task from different service", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "service-1" });
    prismaMock.serviceTask.findMany.mockResolvedValue([
      { id: "task-a" },
      { id: "task-b" },
    ]);

    await expect(
      reorderServiceTasks("tenant-1", "service-1", ["task-a", "task-foreign"]),
    ).rejects.toThrow(/Expected 2 tasks, got 2/);

    expect(prismaMock.serviceTask.update).not.toHaveBeenCalled();
  });
});
