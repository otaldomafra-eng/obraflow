import { z } from "zod";

import { prisma } from "@/server/db/client";

const createPropertySchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

const updatePropertySchema = createPropertySchema.partial();

const listPropertiesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  clientId: z.string().optional(),
});

export type CreatePropertyInput = z.input<typeof createPropertySchema>;
export type UpdatePropertyInput = z.input<typeof updatePropertySchema>;
export type ListPropertiesInput = z.input<typeof listPropertiesSchema>;

export async function createProperty(tenantId: string, input: CreatePropertyInput) {
  const data = createPropertySchema.parse(input);

  return prisma.property.create({
    data: {
      tenantId,
      clientId: data.clientId,
      name: data.name,
      address: data.address ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      postalCode: data.postalCode ?? null,
      notes: data.notes ?? null,
    },
  });
}

export async function updateProperty(
  tenantId: string,
  propertyId: string,
  input: UpdatePropertyInput,
) {
  const data = updatePropertySchema.parse(input);

  return prisma.property.update({
    where: { tenantId_id: { tenantId, id: propertyId } },
    data: {
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.address !== undefined && { address: data.address ?? null }),
      ...(data.city !== undefined && { city: data.city ?? null }),
      ...(data.state !== undefined && { state: data.state ?? null }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode ?? null }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
    },
  });
}

export async function listProperties(
  tenantId: string,
  input?: ListPropertiesInput,
) {
  const { page, pageSize, search, clientId } = listPropertiesSchema.parse(input ?? {});

  const where = {
    tenantId,
    ...(clientId ? { clientId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { address: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { services: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return { items, total, page, pageSize };
}
