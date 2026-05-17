import { prisma } from "@/server/db/client";

export interface DashboardData {
  clientCount: number;
  propertyCount: number;
  serviceCount: number;
  servicesByStatus: { status: string; count: number }[];
  upcomingDueDates: { id: string; title: string; dueDate: Date | null; client: { name: string } }[];
  recentServices: { id: string; title: string; status: string; createdAt: Date; client: { name: string } }[];
  pendingTasks: {
    id: string;
    title: string;
    dueDate: Date | null;
    serviceId: string;
    serviceTitle: string;
  }[];
  overdueTasks: {
    id: string;
    title: string;
    dueDate: Date | null;
    serviceId: string;
    serviceTitle: string;
  }[];
}

export async function getDashboardData(tenantId: string): Promise<DashboardData> {
  const now = new Date();

  const [
    clientCount,
    propertyCount,
    serviceCount,
    servicesByStatus,
    upcomingDueDates,
    recentServices,
    pendingTasks,
    overdueTasks,
  ] = await Promise.all([
    prisma.client.count({ where: { tenantId } }),
    prisma.property.count({ where: { tenantId } }),
    prisma.service.count({ where: { tenantId } }),
    prisma.service.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.service.findMany({
      where: {
        tenantId,
        dueDate: { gte: now },
        status: { notIn: ["DELIVERED", "CANCELED"] },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, title: true, dueDate: true, client: { select: { name: true } } },
    }),
    prisma.service.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true, client: { select: { name: true } } },
    }),
    prisma.serviceTask.findMany({
      where: {
        tenantId,
        status: { notIn: ["DELIVERED", "CANCELED"] },
        dueDate: { gte: now },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        serviceId: true,
        service: { select: { title: true } },
      },
    }),
    prisma.serviceTask.findMany({
      where: {
        tenantId,
        status: { notIn: ["DELIVERED", "CANCELED"] },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        serviceId: true,
        service: { select: { title: true } },
      },
    }),
  ]);

  return {
    clientCount,
    propertyCount,
    serviceCount,
    servicesByStatus: servicesByStatus.map((s) => ({ status: s.status, count: s._count })),
    upcomingDueDates,
    recentServices,
    pendingTasks: pendingTasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      serviceId: t.serviceId,
      serviceTitle: t.service.title,
    })),
    overdueTasks: overdueTasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      serviceId: t.serviceId,
      serviceTitle: t.service.title,
    })),
  };
}
