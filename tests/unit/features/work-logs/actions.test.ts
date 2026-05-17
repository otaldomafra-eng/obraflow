import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    workLog: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { updateWorkLog, deleteWorkLog } from "@/features/work-logs/actions";

describe("work log actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateWorkLog", () => {
    it("rejects empty summary", async () => {
      await expect(
        updateWorkLog("tenant-1", "service-1", "task-1", "log-1", {
          summary: "",
        }),
      ).rejects.toThrow();
    });

    it("asserts work log belongs to task/tenant before updating", async () => {
      prismaMock.workLog.findFirst.mockResolvedValue(null);

      await expect(
        updateWorkLog("tenant-1", "service-1", "task-1", "log-1", {
          summary: "Updated",
        }),
      ).rejects.toThrow("does not belong to task");
    });

    it("calls prisma.workLog.update with correct data", async () => {
      prismaMock.workLog.findFirst.mockResolvedValue({ id: "log-1" });
      prismaMock.workLog.update.mockResolvedValue({ id: "log-1" });

      const result = await updateWorkLog(
        "tenant-1",
        "service-1",
        "task-1",
        "log-1",
        {
          summary: "Updated summary",
          description: null,
          hours: null,
        },
      );

      expect(prismaMock.workLog.update).toHaveBeenCalledWith({
        where: { tenantId_id: { tenantId: "tenant-1", id: "log-1" } },
        data: {
          summary: "Updated summary",
          description: null,
          hours: null,
        },
      });
      expect(result).toEqual({ id: "log-1" });
    });

    it("clears optional fields when passed null", async () => {
      prismaMock.workLog.findFirst.mockResolvedValue({ id: "log-1" });
      prismaMock.workLog.update.mockResolvedValue({ id: "log-1" });

      await updateWorkLog("tenant-1", "service-1", "task-1", "log-1", {
        description: null,
        hours: null,
      });

      const callArgs = prismaMock.workLog.update.mock.calls[0][0];
      expect(callArgs.data.description).toBeNull();
      expect(callArgs.data.hours).toBeNull();
    });

    it("skips fields not provided", async () => {
      prismaMock.workLog.findFirst.mockResolvedValue({ id: "log-1" });
      prismaMock.workLog.update.mockResolvedValue({ id: "log-1" });

      await updateWorkLog("tenant-1", "service-1", "task-1", "log-1", {
        summary: "Only summary",
      });

      const callArgs = prismaMock.workLog.update.mock.calls[0][0];
      expect(callArgs.data.summary).toBe("Only summary");
      expect(callArgs.data.description).toBeUndefined();
      expect(callArgs.data.hours).toBeUndefined();
    });
  });

  describe("deleteWorkLog", () => {
    it("asserts work log belongs to task/tenant before deleting", async () => {
      prismaMock.workLog.findFirst.mockResolvedValue(null);

      await expect(
        deleteWorkLog("tenant-1", "service-1", "task-1", "log-1"),
      ).rejects.toThrow("does not belong to task");
    });

    it("calls prisma.workLog.delete with correct where", async () => {
      prismaMock.workLog.findFirst.mockResolvedValue({ id: "log-1" });
      prismaMock.workLog.delete.mockResolvedValue({ id: "log-1" });

      await deleteWorkLog("tenant-1", "service-1", "task-1", "log-1");

      expect(prismaMock.workLog.delete).toHaveBeenCalledWith({
        where: { tenantId_id: { tenantId: "tenant-1", id: "log-1" } },
      });
    });
  });
});
