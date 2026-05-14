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

export type CreateWorkLogInput = z.input<typeof createWorkLogSchema>;

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

export { createWorkLogSchema };