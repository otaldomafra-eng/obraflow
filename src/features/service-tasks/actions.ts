import { z } from "zod";

import { prisma } from "@/server/db/client";

const taskStatuses = [
  "PLANNING",
  "PRODUCTION",
  "DELIVERED",
  "CANCELED",
] as const;

const createServiceTaskSchema = z.object({
  serviceId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(taskStatuses).optional(),
  dueDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
});

const updateServiceTaskSchema = createServiceTaskSchema.partial();

export type CreateServiceTaskInput = z.input<typeof createServiceTaskSchema>;
export type UpdateServiceTaskInput = z.input<typeof updateServiceTaskSchema>;

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

async function assertTaskBelongsToTenant(
  tenantId: string,
  taskId: string,
): Promise<void> {
  const task = await prisma.serviceTask.findUnique({
    where: { tenantId_id: { tenantId, id: taskId } },
    select: { id: true },
  });

  if (!task) {
    throw new Error(
      `Task ${taskId} does not belong to tenant ${tenantId}`,
    );
  }
}

export async function createServiceTask(
  tenantId: string,
  input: CreateServiceTaskInput,
) {
  const data = createServiceTaskSchema.parse(input);

  await assertServiceBelongsToTenant(tenantId, data.serviceId);

  return prisma.serviceTask.create({
    data: {
      tenantId,
      serviceId: data.serviceId,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? "PLANNING",
      dueDate: data.dueDate,
    },
  });
}

export async function updateServiceTask(
  tenantId: string,
  taskId: string,
  input: UpdateServiceTaskInput,
) {
  const data = updateServiceTaskSchema.parse(input);

  if (data.serviceId !== undefined) {
    await assertServiceBelongsToTenant(tenantId, data.serviceId);
  }

  const updateData: Record<string, unknown> = {};

  if (data.serviceId !== undefined) updateData.serviceId = data.serviceId;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined)
    updateData.description = data.description ?? null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;

  return prisma.serviceTask.update({
    where: { tenantId_id: { tenantId, id: taskId } },
    data: updateData,
  });
}

export async function deleteServiceTask(tenantId: string, taskId: string) {
  await assertTaskBelongsToTenant(tenantId, taskId);

  return prisma.serviceTask.delete({
    where: { tenantId_id: { tenantId, id: taskId } },
  });
}

export async function listServiceTasks(tenantId: string, serviceId: string) {
  await assertServiceBelongsToTenant(tenantId, serviceId);

  return prisma.serviceTask.findMany({
    where: { tenantId, serviceId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { workLogs: true } },
    },
  });
}

export async function getServiceTask(tenantId: string, taskId: string) {
  await assertTaskBelongsToTenant(tenantId, taskId);

  return prisma.serviceTask.findUnique({
    where: { tenantId_id: { tenantId, id: taskId } },
    include: {
      _count: { select: { workLogs: true } },
    },
  });
}

export { createServiceTaskSchema, updateServiceTaskSchema };