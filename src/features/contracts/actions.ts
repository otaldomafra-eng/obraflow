import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db/client";

export const CONTRACT_STATUSES = ["DRAFT", "ISSUED", "SIGNED", "COMPLETED", "CANCELLED"] as const;

export const createContractSchema = z.object({
  serviceId: z.string().min(1),
  proposalId: z.string().min(1).optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
}).strict();

export const updateContractSchema = z.object({
  status: z.enum(CONTRACT_STATUSES).optional(),
}).strict();

export type CreateContractInput = z.input<typeof createContractSchema>;
export type UpdateContractInput = z.input<typeof updateContractSchema>;

const contractInclude = {
  service: {
    select: {
      id: true,
      title: true,
      client: { select: { id: true, name: true } },
      property: { select: { id: true, name: true } },
    },
  },
  proposal: { select: { id: true, title: true } },
} as const;

async function assertServiceBelongsToTenant(tenantId: string, serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { tenantId_id: { tenantId, id: serviceId } },
    select: { id: true },
  });
  if (!service) throw new Error(`Service ${serviceId} does not belong to tenant ${tenantId}`);
}

async function assertProposalBelongsToService(tenantId: string, serviceId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { tenantId, serviceId, id: proposalId },
    select: { id: true },
  });
  if (!proposal) throw new Error(`Proposal ${proposalId} does not belong to service ${serviceId} in tenant ${tenantId}`);
}

async function assertContractBelongsToTenant(tenantId: string, contractId: string) {
  const contract = await prisma.contract.findFirst({
    where: { tenantId, id: contractId },
    select: { id: true, signedAt: true },
  });
  if (!contract) throw new Error(`Contract ${contractId} does not belong to tenant ${tenantId}`);
  return contract;
}

export async function generateContractNumber(tenantId: string) {
  const contracts = await prisma.contract.findMany({
    where: { tenantId, number: { startsWith: "CT-" } },
    select: { number: true },
  });

  const maxSeq = contracts.reduce((max, c) => {
    const match = /^CT-(\d+)$/.exec(c.number);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return `CT-${String(maxSeq + 1).padStart(5, "0")}`;
}

function statusTimestampData(status: string | undefined, currentSignedAt: Date | null) {
  if (!status) return {};
  if (status === "SIGNED" && !currentSignedAt) return { signedAt: new Date() };
  if (status !== "SIGNED" && currentSignedAt) return { signedAt: null };
  return {};
}

export async function createContract(tenantId: string, input: CreateContractInput) {
  const data = createContractSchema.parse(input);

  await assertServiceBelongsToTenant(tenantId, data.serviceId);
  if (data.proposalId) await assertProposalBelongsToService(tenantId, data.serviceId, data.proposalId);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const number = await generateContractNumber(tenantId);
    try {
      return await prisma.contract.create({
        data: {
          tenantId,
          serviceId: data.serviceId,
          proposalId: data.proposalId ?? null,
          number,
          status: data.status ?? "DRAFT",
          ...statusTimestampData(data.status ?? "DRAFT", null),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Could not generate a unique contract number");
}

export async function updateContract(tenantId: string, contractId: string, input: UpdateContractInput) {
  const data = updateContractSchema.parse(input);
  const current = await assertContractBelongsToTenant(tenantId, contractId);

  return prisma.contract.update({
    where: { tenantId_id: { tenantId, id: contractId } },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...statusTimestampData(data.status, current.signedAt),
    },
  });
}

export async function listContracts(
  tenantId: string,
  options?: { serviceId?: string; proposalId?: string; status?: string; search?: string },
) {
  return prisma.contract.findMany({
    where: {
      tenantId,
      ...(options?.serviceId ? { serviceId: options.serviceId } : {}),
      ...(options?.proposalId ? { proposalId: options.proposalId } : {}),
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.search ? { number: { contains: options.search, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: contractInclude,
  });
}

export async function getContract(tenantId: string, contractId: string) {
  return prisma.contract.findFirst({
    where: { tenantId, id: contractId },
    include: contractInclude,
  });
}
