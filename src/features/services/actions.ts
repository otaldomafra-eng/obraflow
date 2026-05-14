import { z } from "zod";

import { prisma } from "@/server/db/client";

const serviceTypes = [
  "TECHNICAL_PROJECT",
  "REGULARIZATION",
  "WORK_EXECUTION",
  "CONSULTING",
  "FIRE_SAFETY",
  "PROJECT_APPROVAL_WORK",
] as const;

const serviceStatuses = [
  "NEW",
  "PROPOSAL",
  "AWAITING_ACCEPTANCE",
  "CONTRACTED",
  "PLANNING",
  "PRODUCTION",
  "APPROVAL",
  "WORK",
  "AWAITING_CLIENT",
  "PAUSED",
  "DELIVERED",
  "CANCELED",
] as const;

export const createServiceSchema = z.object({
  clientId: z.string().min(1),
  propertyId: z.string().optional(),
  title: z.string().min(1),
  type: z.enum(serviceTypes),
  status: z.enum(serviceStatuses).optional(),
  description: z.string().optional(),
  startDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  dueDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  status: z.enum(serviceStatuses).optional(),
});

export const listServicesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  clientId: z.string().optional(),
  propertyId: z.string().optional(),
  status: z.enum(serviceStatuses).optional(),
});

export type CreateServiceInput = z.input<typeof createServiceSchema>;
export type UpdateServiceInput = z.input<typeof updateServiceSchema>;
export type ListServicesInput = z.input<typeof listServicesSchema>;

async function assertClientBelongsToTenant(
  tenantId: string,
  clientId: string,
): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { tenantId_id: { tenantId, id: clientId } },
    select: { id: true },
  });

  if (!client) {
    throw new Error(
      `Client ${clientId} does not belong to tenant ${tenantId}`,
    );
  }
}

async function assertPropertyBelongsToTenantAndClient(
  tenantId: string,
  clientId: string,
  propertyId: string,
): Promise<void> {
  const property = await prisma.property.findUnique({
    where: { tenantId_clientId_id: { tenantId, clientId, id: propertyId } },
    select: { id: true },
  });

  if (!property) {
    throw new Error(
      `Property ${propertyId} does not belong to client ${clientId} in tenant ${tenantId}`,
    );
  }
}

export async function createService(
  tenantId: string,
  input: CreateServiceInput,
) {
  const data = createServiceSchema.parse(input);

  await assertClientBelongsToTenant(tenantId, data.clientId);

  if (data.propertyId) {
    await assertPropertyBelongsToTenantAndClient(
      tenantId,
      data.clientId,
      data.propertyId,
    );
  }

  return prisma.service.create({
    data: {
      tenantId,
      clientId: data.clientId,
      propertyId: data.propertyId ?? null,
      title: data.title,
      type: data.type,
      status: data.status ?? "NEW",
      description: data.description ?? null,
      startDate: data.startDate,
      dueDate: data.dueDate,
    },
  });
}

export async function updateService(
  tenantId: string,
  serviceId: string,
  input: UpdateServiceInput,
) {
  const data = updateServiceSchema.parse(input);
  let existingService:
    | {
        clientId: string;
        propertyId: string | null;
      }
    | null
    | undefined;

  async function getExistingService() {
    existingService ??= await prisma.service.findUnique({
      where: { tenantId_id: { tenantId, id: serviceId } },
      select: { clientId: true, propertyId: true },
    });

    if (!existingService) {
      throw new Error(
        `Service ${serviceId} does not belong to tenant ${tenantId}`,
      );
    }

    return existingService;
  }

  if (data.clientId !== undefined) {
    await assertClientBelongsToTenant(tenantId, data.clientId);
  }

  const needsExistingService =
    (data.propertyId !== undefined &&
      data.propertyId !== null &&
      data.clientId === undefined) ||
    (data.clientId !== undefined && data.propertyId === undefined);

  const service = needsExistingService ? await getExistingService() : null;
  const clientId = data.clientId ?? service?.clientId;
  const propertyId =
    data.propertyId !== undefined
      ? data.propertyId
      : data.clientId !== undefined
        ? service?.propertyId
        : undefined;

  if (propertyId !== undefined && propertyId !== null) {
    await assertPropertyBelongsToTenantAndClient(
      tenantId,
      clientId ?? (await getExistingService()).clientId,
      propertyId,
    );
  }

  return prisma.service.update({
    where: { tenantId_id: { tenantId, id: serviceId } },
    data: {
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.propertyId !== undefined && {
        propertyId: data.propertyId ?? null,
      }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.description !== undefined && {
        description: data.description ?? null,
      }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
    },
  });
}

export async function listServices(
  tenantId: string,
  input?: ListServicesInput,
) {
  const { page, pageSize, search, clientId, propertyId, status } =
    listServicesSchema.parse(input ?? {});

  const where = {
    tenantId,
    ...(clientId ? { clientId } : {}),
    ...(propertyId ? { propertyId } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        property: { select: { id: true, name: true } },
        _count: { select: { tasks: true, documents: true } },
      },
    }),
    prisma.service.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getServiceDetail(tenantId: string, serviceId: string) {
  return prisma.service.findUnique({
    where: { tenantId_id: { tenantId, id: serviceId } },
    include: {
      client: { select: { id: true, name: true, email: true, phone: true } },
      property: { select: { id: true, name: true, address: true, city: true } },
      _count: {
        select: {
          tasks: true,
          documents: true,
          proposals: true,
          contracts: true,
          workLogs: true,
        },
      },
    },
  });
}
