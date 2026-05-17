import { z } from "zod";

import { prisma } from "@/server/db/client";

const createWorkLogSchema = z.object({
  serviceId: z.string().min(1),
  taskId: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().optional(),
  performedAt: z.string().min(1).refine((v) => !isNaN(new Date(v).getTime()), {
    message: "Invalid date format",
  }).transform((v) => new Date(v)),
  hours: z.string().optional().transform((v) => (v ? Number(v) : null)),
});

const updateWorkLogSchema = z.object({
  summary: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  performedAt: z.string().min(1).refine((v) => !isNaN(new Date(v).getTime()), {
    message: "Invalid date format",
  }).transform((v) => new Date(v)).optional(),
  hours: z.string().nullable().optional().transform((v) => {
    if (v === null || v === "") return null;
    if (v === undefined) return undefined;
    return Number(v);
  }),
});

export type CreateWorkLogInput = z.input<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.input<typeof updateWorkLogSchema>;

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

async function assertWorkLogBelongsToTask(
  tenantId: string,
  serviceId: string,
  taskId: string,
  workLogId: string,
): Promise<void> {
  const log = await prisma.workLog.findFirst({
    where: { tenantId, serviceId, taskId, id: workLogId },
    select: { id: true },
  });

  if (!log) {
    throw new Error(
      `WorkLog ${workLogId} does not belong to task ${taskId} in tenant ${tenantId}`,
    );
  }
}

export async function createWorkLog(
  tenantId: string,
  input: CreateWorkLogInput,
) {
  const data = createWorkLogSchema.parse(input);

  await assertTaskBelongsToService(tenantId, data.serviceId, data.taskId);

  return prisma.workLog.create({
    data: {
      tenantId,
      serviceId: data.serviceId,
      taskId: data.taskId,
      summary: data.summary,
      description: data.description ?? null,
      performedAt: data.performedAt,
      hours: data.hours,
    },
  });
}

export async function updateWorkLog(
  tenantId: string,
  serviceId: string,
  taskId: string,
  workLogId: string,
  input: UpdateWorkLogInput,
) {
  const data = updateWorkLogSchema.parse(input);

  await assertWorkLogBelongsToTask(tenantId, serviceId, taskId, workLogId);

  return prisma.workLog.update({
    where: { tenantId_id: { tenantId, id: workLogId } },
    data: {
      ...(data.summary !== undefined && { summary: data.summary }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.performedAt !== undefined && { performedAt: data.performedAt }),
      ...(data.hours !== undefined && { hours: data.hours }),
    },
  });
}

export async function deleteWorkLog(
  tenantId: string,
  serviceId: string,
  taskId: string,
  workLogId: string,
) {
  await assertWorkLogBelongsToTask(tenantId, serviceId, taskId, workLogId);

  await prisma.workLog.delete({
    where: { tenantId_id: { tenantId, id: workLogId } },
  });
}

export async function listWorkLogs(
  tenantId: string,
  serviceId: string,
  taskId: string,
) {
  await assertTaskBelongsToService(tenantId, serviceId, taskId);

  return prisma.workLog.findMany({
    where: { tenantId, serviceId, taskId },
    orderBy: { performedAt: "desc" },
  });
}

export async function getWorkLogHoursTotal(
  tenantId: string,
  serviceId: string,
  taskId: string,
) {
  const result = await prisma.workLog.aggregate({
    where: { tenantId, serviceId, taskId },
    _sum: { hours: true },
  });

  return result._sum.hours ?? 0;
}

export { createWorkLogSchema, updateWorkLogSchema };