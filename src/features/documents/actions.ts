import { z } from "zod";

import { prisma } from "@/server/db/client";
import { uploadFile } from "@/server/storage/supabase";
import { validateFile, sanitizeFileName, buildStoragePath } from "@/server/storage/validation";

const VISIBILITIES = ["INTERNAL", "CLIENT_VISIBLE", "SUPPLIER_VISIBLE"] as const;

export const createDocumentSchema = z.object({
  serviceId: z.string().min(1),
  proposalId: z.string().optional(),
  title: z.string().min(1),
  url: z.string().min(1),
  visibility: z.enum(VISIBILITIES).optional(),
  mimeType: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  visibility: z.enum(VISIBILITIES).optional(),
  mimeType: z.string().optional(),
});

export type CreateDocumentInput = z.input<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.input<typeof updateDocumentSchema>;

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
): Promise<void> {
  const proposal = await prisma.proposal.findFirst({
    where: { tenantId, serviceId, id: proposalId },
    select: { id: true },
  });

  if (!proposal) {
    throw new Error(
      `Proposal ${proposalId} does not belong to service ${serviceId} in tenant ${tenantId}`,
    );
  }
}

const documentInclude = {
  service: {
    select: {
      id: true,
      title: true,
      client: { select: { id: true, name: true } },
      property: { select: { id: true, name: true } },
    },
  },
  proposal: {
    select: { id: true, title: true },
  },
} as const;

export async function createDocument(tenantId: string, input: CreateDocumentInput) {
  const data = createDocumentSchema.parse(input);

  await assertServiceBelongsToTenant(tenantId, data.serviceId);

  if (data.proposalId) {
    await assertProposalBelongsToService(tenantId, data.serviceId, data.proposalId);
  }

  return prisma.document.create({
    data: {
      tenantId,
      serviceId: data.serviceId,
      proposalId: data.proposalId ?? null,
      title: data.title,
      url: data.url,
      visibility: data.visibility ?? "INTERNAL",
      mimeType: data.mimeType ?? null,
    },
  });
}

export async function updateDocument(
  tenantId: string,
  documentId: string,
  input: UpdateDocumentInput,
) {
  const data = updateDocumentSchema.parse(input);

  const existing = await prisma.document.findFirst({
    where: { tenantId, id: documentId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error(`Document ${documentId} not found in tenant ${tenantId}`);
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.visibility !== undefined) updateData.visibility = data.visibility;
  if (data.mimeType !== undefined) updateData.mimeType = data.mimeType ?? null;

  return prisma.document.update({
    where: { tenantId_id: { tenantId, id: documentId } },
    data: updateData,
  });
}

export async function listDocuments(
  tenantId: string,
  options?: { serviceId?: string; proposalId?: string; visibility?: string; search?: string },
) {
  const where: Record<string, unknown> = { tenantId };

  if (options?.serviceId) where.serviceId = options.serviceId;
  if (options?.proposalId) where.proposalId = options.proposalId;
  if (options?.visibility) where.visibility = options.visibility;
  if (options?.search) {
    where.title = { contains: options.search, mode: "insensitive" };
  }

  return prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: documentInclude,
  });
}

export async function getDocument(tenantId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { tenantId, id: documentId },
    include: documentInclude,
  });
}

export interface UploadDocumentInput {
  serviceId: string;
  proposalId?: string;
  title: string;
  visibility: "INTERNAL" | "CLIENT_VISIBLE" | "SUPPLIER_VISIBLE";
  file: File;
}

export async function uploadDocument(tenantId: string, input: UploadDocumentInput) {
  const validation = validateFile({
    name: input.file.name,
    size: input.file.size,
    type: input.file.type,
  });
  if (!validation.ok) throw new Error(validation.error);

  await assertServiceBelongsToTenant(tenantId, input.serviceId);

  if (input.proposalId) {
    await assertProposalBelongsToService(tenantId, input.serviceId, input.proposalId);
  }

  const safeName = sanitizeFileName(input.file.name);

  const document = await prisma.document.create({
    data: {
      tenantId,
      serviceId: input.serviceId,
      proposalId: input.proposalId ?? null,
      title: input.title,
      url: "/api/documents/PENDING/download",
      visibility: input.visibility,
      mimeType: input.file.type,
    },
  });

  const storagePath = buildStoragePath(tenantId, input.serviceId, document.id, safeName);

  try {
    await uploadFile(storagePath, input.file);
  } catch (uploadError) {
    await prisma.document.delete({
      where: { tenantId_id: { tenantId, id: document.id } },
    });
    throw new Error(`Upload failed: ${uploadError instanceof Error ? uploadError.message : "unknown error"}`);
  }

  return prisma.document.update({
    where: { tenantId_id: { tenantId, id: document.id } },
    data: {
      storagePath,
      fileName: safeName,
      fileSize: input.file.size,
      uploadedAt: new Date(),
      url: `/api/documents/${document.id}/download`,
    },
  });
}
