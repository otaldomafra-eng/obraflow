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

const updateServiceTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(taskStatuses).optional(),
  dueDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
});

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

async function assertTaskBelongsToService(
  tenantId: string,
  serviceId: string,
  taskId: string,
): Promise<void> {
  const task = await prisma.serviceTask.findFirst({
    where: { tenantId, serviceId, id: taskId },
    select: { id: true },
  });

  if (!task) {
    throw new Error(
      `Task ${taskId} does not belong to service ${serviceId} in tenant ${tenantId}`,
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
  serviceId: string,
  taskId: string,
  input: UpdateServiceTaskInput,
) {
  const data = updateServiceTaskSchema.parse(input);

  await assertTaskBelongsToService(tenantId, serviceId, taskId);

  const updateData: Record<string, unknown> = {};

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

export async function deleteServiceTask(
  tenantId: string,
  serviceId: string,
  taskId: string,
) {
  await assertTaskBelongsToService(tenantId, serviceId, taskId);

  try {
    return await prisma.serviceTask.delete({
      where: { tenantId_id: { tenantId, id: taskId } },
    });
  } catch (error) {
    const prismaError = error as { code?: string; message?: string };
    if (prismaError.code === "P2003") {
      throw new Error(
        "Esta tarefa possui registros de trabalho vinculados e não pode ser deletada. " +
        "Altere o status para CANCELADO se deseja encerrá-la.",
      );
    }
    throw error;
  }
}

export async function listServiceTasks(tenantId: string, serviceId: string) {
  await assertServiceBelongsToTenant(tenantId, serviceId);

  return prisma.serviceTask.findMany({
    where: { tenantId, serviceId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { workLogs: true } },
    },
  });
}

const reorderServiceTasksSchema = z.object({
  taskIds: z.array(z.string().min(1)).min(2),
});

export async function reorderServiceTasks(
  tenantId: string,
  serviceId: string,
  taskIds: string[],
) {
  reorderServiceTasksSchema.parse({ taskIds });

  // Reject duplicate IDs in the request
  if (new Set(taskIds).size !== taskIds.length) {
    throw new Error("Duplicate task IDs are not allowed");
  }

  await assertServiceBelongsToTenant(tenantId, serviceId);

  // Fetch ALL tasks for this service to enforce full list validation
  const allTasks = await prisma.serviceTask.findMany({
    where: { tenantId, serviceId },
    select: { id: true },
  });

  const allTaskIds = allTasks.map((t) => t.id).sort();
  const sortedInput = [...taskIds].sort();

  // The submitted list must contain exactly the same IDs as the service's tasks
  if (
    allTaskIds.length !== sortedInput.length ||
    !allTaskIds.every((id, i) => id === sortedInput[i])
  ) {
    throw new Error(
      `The task list must include all tasks of service ${serviceId}. ` +
        `Expected ${allTaskIds.length} tasks, got ${taskIds.length}.`,
    );
  }

  const updates = taskIds.map((id, index) =>
    prisma.serviceTask.update({
      where: { tenantId_id: { tenantId, id } },
      data: { sortOrder: index },
    }),
  );

  await prisma.$transaction(updates);
}

export async function completeServiceTask(
  tenantId: string,
  serviceId: string,
  taskId: string,
) {
  await assertTaskBelongsToService(tenantId, serviceId, taskId);

  return prisma.serviceTask.update({
    where: { tenantId_id: { tenantId, id: taskId } },
    data: { status: "DELIVERED", completedAt: new Date() },
  });
}

export async function reopenServiceTask(
  tenantId: string,
  serviceId: string,
  taskId: string,
) {
  await assertTaskBelongsToService(tenantId, serviceId, taskId);

  return prisma.serviceTask.update({
    where: { tenantId_id: { tenantId, id: taskId } },
    data: { status: "PLANNING", completedAt: null },
  });
}

export async function getServiceTask(
  tenantId: string,
  serviceId: string,
  taskId: string,
) {
  const task = await prisma.serviceTask.findFirst({
    where: { tenantId, serviceId, id: taskId },
    include: {
      _count: { select: { workLogs: true } },
    },
  });

  if (!task) return null;

  const hoursResult = await prisma.workLog.aggregate({
    where: { tenantId, serviceId, taskId },
    _sum: { hours: true },
  });

  return {
    ...task,
    totalHours: hoursResult._sum.hours ?? 0,
  };
}

export { createServiceTaskSchema, updateServiceTaskSchema };