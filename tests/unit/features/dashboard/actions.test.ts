import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    client: { count: vi.fn() },
    property: { count: vi.fn() },
    service: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { getDashboardData } from "@/features/dashboard/actions";

describe("dashboard actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna dados zerados quando tenant não tem dados", async () => {
    prismaMock.client.count.mockResolvedValue(0);
    prismaMock.property.count.mockResolvedValue(0);
    prismaMock.service.count.mockResolvedValue(0);
    prismaMock.service.groupBy.mockResolvedValue([]);
    prismaMock.service.findMany.mockResolvedValue([]);

    const result = await getDashboardData("tenant-1");

    expect(result.clientCount).toBe(0);
    expect(result.propertyCount).toBe(0);
    expect(result.serviceCount).toBe(0);
    expect(result.servicesByStatus).toEqual([]);
    expect(result.upcomingDueDates).toEqual([]);
    expect(result.recentServices).toEqual([]);
  });

  it("retorna dados consolidados quando tenant tem dados", async () => {
    prismaMock.client.count.mockResolvedValue(5);
    prismaMock.property.count.mockResolvedValue(10);
    prismaMock.service.count.mockResolvedValue(20);
    prismaMock.service.groupBy.mockResolvedValue([
      { status: "NEW", _count: 5 },
      { status: "PRODUCTION", _count: 8 },
      { status: "DELIVERED", _count: 7 },
    ]);
    prismaMock.service.findMany
      .mockResolvedValueOnce([
        { id: "svc-1", title: "Projeto A", dueDate: new Date("2026-06-01"), client: { name: "Cliente A" } },
      ])
      .mockResolvedValueOnce([
        { id: "svc-2", title: "Projeto B", status: "NEW", createdAt: new Date("2026-05-15"), client: { name: "Cliente B" } },
      ]);

    const result = await getDashboardData("tenant-1");

    expect(result.clientCount).toBe(5);
    expect(result.propertyCount).toBe(10);
    expect(result.serviceCount).toBe(20);
    expect(result.servicesByStatus).toHaveLength(3);
    expect(result.upcomingDueDates).toHaveLength(1);
    expect(result.upcomingDueDates[0].title).toBe("Projeto A");
    expect(result.recentServices).toHaveLength(1);
    expect(result.recentServices[0].title).toBe("Projeto B");
  });
});
