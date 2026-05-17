import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    serviceTask: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { completeServiceTask, reopenServiceTask } from "@/features/service-tasks/actions";

describe("completeServiceTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asserts task belongs to tenant before completing", async () => {
    prismaMock.serviceTask.findFirst.mockResolvedValue(null);

    await expect(
      completeServiceTask("tenant-1", "service-1", "task-1"),
    ).rejects.toThrow("does not belong to service");
  });

  it("sets status to DELIVERED and completedAt", async () => {
    const now = new Date("2026-05-16T00:00:00Z");
    vi.setSystemTime(now);

    prismaMock.serviceTask.findFirst.mockResolvedValue({ id: "task-1" });
    prismaMock.serviceTask.update.mockResolvedValue({ id: "task-1", status: "DELIVERED", completedAt: now });

    const result = await completeServiceTask("tenant-1", "service-1", "task-1");

    expect(prismaMock.serviceTask.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "task-1" } },
      data: { status: "DELIVERED", completedAt: now },
    });
    expect(result.status).toBe("DELIVERED");
  });
});

describe("reopenServiceTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asserts task belongs to tenant before reopening", async () => {
    prismaMock.serviceTask.findFirst.mockResolvedValue(null);

    await expect(
      reopenServiceTask("tenant-1", "service-1", "task-1"),
    ).rejects.toThrow("does not belong to service");
  });

  it("sets status to PLANNING and clears completedAt", async () => {
    prismaMock.serviceTask.findFirst.mockResolvedValue({ id: "task-1" });
    prismaMock.serviceTask.update.mockResolvedValue({ id: "task-1", status: "PLANNING", completedAt: null });

    const result = await reopenServiceTask("tenant-1", "service-1", "task-1");

    expect(prismaMock.serviceTask.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "task-1" } },
      data: { status: "PLANNING", completedAt: null },
    });
    expect(result.status).toBe("PLANNING");
  });
});
