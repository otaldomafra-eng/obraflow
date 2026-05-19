import { Decimal } from "@prisma/client/runtime/client";
import { z } from "zod";

import { prisma } from "@/server/db/client";

export const PROPOSAL_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELED"] as const;

const createProposalSchema = z.object({
  serviceId: z.string().min(1),
  title: z.string().min(1),
  totalAmount: z.string().optional().transform((v) => (v ? new Decimal(v) : undefined)),
  status: z.enum(PROPOSAL_STATUSES).optional(),
  validUntil: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  notes: z.string().optional(),
});

const updateProposalSchema = z.object({
  serviceId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  totalAmount: z.string().optional().transform((v) => (v ? new Decimal(v) : undefined)),
  status: z.enum(PROPOSAL_STATUSES).optional(),
  validUntil: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  notes: z.string().optional(),
});

export type CreateProposalInput = z.input<typeof createProposalSchema>;
export type UpdateProposalInput = z.input<typeof updateProposalSchema>;

async function assertServiceBelongsToTenant(
  tenantId: string,
  serviceId: string,
): Promise<void> {
  const service = await prisma.service.findUnique({
    where: { tenantId_id: { tenantId, id: serviceId } },
    select: { id: true },
  });

  if (!service) {
    throw new Error(
      `Service ${serviceId} does not belong to tenant ${tenantId}`,
    );
  }
}

async function assertProposalBelongsToService(
  tenantId: string,
  serviceId: string,
  proposalId: string,
): Promise<{ sentAt: Date | null; acceptedAt: Date | null }> {
  const proposal = await prisma.proposal.findFirst({
    where: { tenantId, serviceId, id: proposalId },
    select: { sentAt: true, acceptedAt: true },
  });

  if (!proposal) {
    throw new Error(
      `Proposal ${proposalId} does not belong to service ${serviceId} in tenant ${tenantId}`,
    );
  }

  return { sentAt: proposal.sentAt, acceptedAt: proposal.acceptedAt };
}

function computeStatusTimestamps(
  status: string,
  current: { sentAt: Date | null; acceptedAt: Date | null },
): { sentAt?: Date | null; acceptedAt?: Date | null } {
  const result: { sentAt?: Date | null; acceptedAt?: Date | null } = {};

  if (status === "SENT" && !current.sentAt) {
    result.sentAt = new Date();
  }

  if (status === "ACCEPTED" && !current.acceptedAt) {
    result.acceptedAt = new Date();
  }

  if (status !== "ACCEPTED" && current.acceptedAt) {
    result.acceptedAt = null;
  }

  return result;
}

export async function createProposal(tenantId: string, input: CreateProposalInput) {
  const data = createProposalSchema.parse(input);

  await assertServiceBelongsToTenant(tenantId, data.serviceId);

  return prisma.proposal.create({
    data: {
      tenantId,
      serviceId: data.serviceId,
      title: data.title,
      totalAmount: data.totalAmount,
      status: data.status ?? "DRAFT",
      validUntil: data.validUntil,
      notes: data.notes ?? null,
    },
  });
}

export async function updateProposal(
  tenantId: string,
  serviceId: string,
  proposalId: string,
  input: UpdateProposalInput,
) {
  const data = updateProposalSchema.parse(input);

  const current = await assertProposalBelongsToService(tenantId, serviceId, proposalId);

  const updateData: Record<string, unknown> = {};

  if (data.serviceId !== undefined) updateData.serviceId = data.serviceId;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
  if (data.notes !== undefined) updateData.notes = data.notes ?? null;

  if (data.status !== undefined) {
    const timestamps = computeStatusTimestamps(data.status, current);
    if (timestamps.sentAt !== undefined) updateData.sentAt = timestamps.sentAt;
    if (timestamps.acceptedAt !== undefined) updateData.acceptedAt = timestamps.acceptedAt;
  }

  return prisma.proposal.update({
    where: { tenantId_id: { tenantId, id: proposalId } },
    data: updateData,
  });
}

export async function listProposals(
  tenantId: string,
  options?: { serviceId?: string; status?: string; search?: string },
) {
  const where: Record<string, unknown> = { tenantId };

  if (options?.serviceId) where.serviceId = options.serviceId;
  if (options?.status) where.status = options.status;
  if (options?.search) {
    where.title = { contains: options.search, mode: "insensitive" };
  }

  return prisma.proposal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          client: { select: { id: true, name: true } },
          property: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function getProposal(tenantId: string, proposalId: string) {
  return prisma.proposal.findFirst({
    where: { tenantId, id: proposalId },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          client: { select: { id: true, name: true } },
          property: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export { createProposalSchema, updateProposalSchema };
