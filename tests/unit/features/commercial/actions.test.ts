import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    proposal: { findMany: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { getCommercialMetrics } from "@/features/commercial/actions";

describe("commercial actions", () => {
  const tenantId = "tenant-1";
  const now = new Date();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes metrics correctly", async () => {
    const futureDate = new Date(now.getTime() + 86400000);
    const pastDate = new Date(now.getTime() - 86400000);

    prismaMock.proposal.findMany.mockResolvedValue([
      {
        id: "p1",
        status: "DRAFT",
        totalAmount: 10000,
        validUntil: futureDate,
        service: { title: "S1", client: { name: "C1" } },
      },
      {
        id: "p2",
        status: "SENT",
        totalAmount: 20000,
        validUntil: null,
        service: { title: "S2", client: { name: "C2" } },
      },
      {
        id: "p3",
        status: "ACCEPTED",
        totalAmount: 30000,
        validUntil: null,
        service: { title: "S3", client: { name: "C3" } },
      },
      {
        id: "p4",
        status: "REJECTED",
        totalAmount: null,
        validUntil: null,
        service: { title: "S4", client: { name: "C4" } },
      },
      {
        id: "p5",
        status: "CANCELED",
        totalAmount: null,
        validUntil: null,
        service: { title: "S5", client: { name: "C5" } },
      },
      {
        id: "p6",
        status: "DRAFT",
        totalAmount: 5000,
        validUntil: pastDate,
        service: { title: "S6", client: { name: "C6" } },
      },
    ]);

    const metrics = await getCommercialMetrics(tenantId);

    expect(metrics.totalProposals).toBe(6);
    expect(metrics.draftCount).toBe(2);
    expect(metrics.sentCount).toBe(1);
    expect(metrics.acceptedCount).toBe(1);
    expect(metrics.rejectedCanceledCount).toBe(2);
    expect(metrics.expiredCount).toBe(1);
    expect(metrics.openValue).toBe(35000);
    expect(metrics.acceptedValue).toBe(30000);
    expect(metrics.recentProposals).toHaveLength(3);
  });

  it("returns zeros when no proposals exist", async () => {
    prismaMock.proposal.findMany.mockResolvedValue([]);
    const metrics = await getCommercialMetrics(tenantId);
    expect(metrics.totalProposals).toBe(0);
    expect(metrics.draftCount).toBe(0);
    expect(metrics.openValue).toBe(0);
    expect(metrics.acceptedValue).toBe(0);
    expect(metrics.recentProposals).toEqual([]);
  });
});
