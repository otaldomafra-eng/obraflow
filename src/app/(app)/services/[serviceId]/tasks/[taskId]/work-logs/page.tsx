import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { WorkLogForm } from "@/features/work-logs/WorkLogForm";
import { WorkLogList } from "@/features/work-logs/WorkLogList";
import { createWorkLog, listWorkLogs, updateWorkLog, deleteWorkLog, getWorkLogHoursTotal } from "@/features/work-logs/actions";
import { getServiceTask } from "@/features/service-tasks/actions";
import { requireTenantId } from "@/server/auth/tenant";

export default async function WorkLogsPage({
  params,
}: {
  params: Promise<{ serviceId: string; taskId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { serviceId, taskId } = await params;

  const task = await getServiceTask(tenantId, serviceId, taskId);

  if (!task) {
    notFound();
  }

  const logs = await listWorkLogs(tenantId, serviceId, taskId);
  const totalHours = await getWorkLogHoursTotal(tenantId, serviceId, taskId);

  async function handleCreate(formData: FormData) {
    "use server";

    await createWorkLog(tenantId, {
      serviceId,
      taskId,
      summary: formData.get("summary") as string,
      description: (formData.get("description") as string) || undefined,
      performedAt: formData.get("performedAt") as string,
      hours: (formData.get("hours") as string) || undefined,
    });

    revalidatePath(`/services/${serviceId}/tasks/${taskId}/work-logs`);
  }

  async function handleEdit(workLogId: string, formData: FormData) {
    "use server";

    await updateWorkLog(tenantId, serviceId, taskId, workLogId, {
      summary: formData.get("summary") as string,
      description: (formData.get("description") as string) || null,
      performedAt: formData.get("performedAt") as string,
      hours: (formData.get("hours") as string) || null,
    });

    revalidatePath(`/services/${serviceId}/tasks/${taskId}/work-logs`);
  }

  async function handleDelete(workLogId: string) {
    "use server";

    await deleteWorkLog(tenantId, serviceId, taskId, workLogId);

    revalidatePath(`/services/${serviceId}/tasks/${taskId}/work-logs`);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href={`/services/${serviceId}`} className="hover:text-zinc-700">
            Serviço
          </Link>
          <span>/</span>
          <Link href={`/services/${serviceId}/tasks/${taskId}`} className="hover:text-zinc-700">
            Tarefa
          </Link>
          <span>/</span>
          <span className="text-zinc-900">Registros de Trabalho</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">Registros de Trabalho</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tarefa: {task.title}
        </p>
        <p className="text-sm text-zinc-500">
          Total de horas: {Number(totalHours).toFixed(2)}h
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkLogList
            data={logs}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
        <div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold">Novo Registro</h2>
            <WorkLogForm action={handleCreate} serviceId={serviceId} taskId={taskId} />
          </div>
        </div>
      </div>
    </div>
  );
}
