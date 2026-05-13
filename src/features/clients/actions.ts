import { z } from "zod";

import { prisma } from "@/server/db/client";

const createClientSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["PERSON", "COMPANY"]),
  document: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial();

const listClientsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type CreateClientInput = z.input<typeof createClientSchema>;
export type UpdateClientInput = z.input<typeof updateClientSchema>;
export type ListClientsInput = z.input<typeof listClientsSchema>;

export async function createClient(tenantId: string, input: CreateClientInput) {
  const data = createClientSchema.parse(input);

  return prisma.client.create({
    data: {
      tenantId,
      name: data.name,
      kind: data.kind,
      document: data.document ?? null,
      email: data.email || null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
    },
  });
}

export async function updateClient(
  tenantId: string,
  clientId: string,
  input: UpdateClientInput,
) {
  const data = updateClientSchema.parse(input);

  return prisma.client.update({
    where: { tenantId_id: { tenantId, id: clientId } },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.kind !== undefined && { kind: data.kind }),
      ...(data.document !== undefined && { document: data.document ?? null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone ?? null }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
    },
  });
}

export async function listClients(
  tenantId: string,
  input?: ListClientsInput,
) {
  const { page, pageSize, search } = listClientsSchema.parse(input ?? {});

  const where = {
    tenantId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { document: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { properties: true, services: true },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getClientDetail(tenantId: string, clientId: string) {
  return prisma.client.findUnique({
    where: { tenantId_id: { tenantId, id: clientId } },
    include: {
      properties: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { services: true } },
        },
      },
      services: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}
