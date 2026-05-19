import { prisma } from "@/server/db/client";

export interface CommercialMetrics {
  totalProposals: number;
  draftCount: number;
  sentCount: number;
  acceptedCount: number;
  rejectedCanceledCount: number;
  expiredCount: number;
  openValue: number;
  acceptedValue: number;
  recentProposals: {
    id: string;
    title: string;
    status: string;
    totalAmount: { toString: () => string } | null;
    validUntil: Date | null;
    service: { title: string; client: { name: string } };
  }[];
}

export async function getCommercialMetrics(
  tenantId: string,
): Promise<CommercialMetrics> {
  const allProposals = await prisma.proposal.findMany({
    where: { tenantId },
    include: {
      service: {
        select: {
          title: true,
          client: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  const draftCount = allProposals.filter((p) => p.status === "DRAFT").length;
  const sentCount = allProposals.filter((p) => p.status === "SENT").length;
  const acceptedCount = allProposals.filter(
    (p) => p.status === "ACCEPTED",
  ).length;
  const rejectedCanceledCount = allProposals.filter(
    (p) => p.status === "REJECTED" || p.status === "CANCELED",
  ).length;
  const expiredCount = allProposals.filter(
    (p) =>
      p.status !== "ACCEPTED" &&
      p.status !== "REJECTED" &&
      p.status !== "CANCELED" &&
      p.validUntil &&
      new Date(p.validUntil) < now,
  ).length;

  const openValue = allProposals
    .filter((p) => p.status === "DRAFT" || p.status === "SENT")
    .reduce((sum, p) => sum + (p.totalAmount ? Number(p.totalAmount) : 0), 0);

  const acceptedValue = allProposals
    .filter((p) => p.status === "ACCEPTED")
    .reduce((sum, p) => sum + (p.totalAmount ? Number(p.totalAmount) : 0), 0);

  const recentProposals = allProposals
    .filter((p) => p.status === "DRAFT" || p.status === "SENT")
    .slice(0, 5);

  return {
    totalProposals: allProposals.length,
    draftCount,
    sentCount,
    acceptedCount,
    rejectedCanceledCount,
    expiredCount,
    openValue,
    acceptedValue,
    recentProposals,
  };
}
