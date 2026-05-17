import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getServiceTask, deleteServiceTask, completeServiceTask, reopenServiceTask } from "@/features/service-tasks/actions";
import { DeleteTaskForm } from "@/features/service-tasks/DeleteTaskForm";
import { requireTenantId } from "@/server/auth/tenant";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { taskStatusLabels, taskStatusColors } from "@/components/ui/status";

export default async function ServiceTaskDetailPage({
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

  async function handleDelete() {
    "use server";

    await deleteServiceTask(tenantId, serviceId, taskId);
    return { redirectUrl: `/services/${serviceId}` };
  }

  async function handleComplete() {
    "use server";

    await completeServiceTask(tenantId, serviceId, taskId);
    revalidatePath(`/services/${serviceId}/tasks/${taskId}`);
  }

  async function handleReopen() {
    "use server";

    await reopenServiceTask(tenantId, serviceId, taskId);
    revalidatePath(`/services/${serviceId}/tasks/${taskId}`);
  }

  const isDelivered = task.status === "DELIVERED";
  const isCanceled = task.status === "CANCELED";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{task.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Tarefa do serviço {serviceId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} labels={taskStatusLabels} colors={taskStatusColors} />
          {!isCanceled && (
            <form action={isDelivered ? handleReopen : handleComplete}>
              <button
                type="submit"
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  isDelivered
                    ? "border-purple-300 text-purple-700 hover:bg-purple-50"
                    : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {isDelivered ? "Reabrir" : "Concluir"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">Detalhes</h2>
        <dl className="space-y-3">
          {task.description && (
            <div>
              <dt className="text-sm font-medium text-zinc-500">Descrição</dt>
              <dd className="text-sm text-zinc-900 whitespace-pre-wrap">
                {task.description}
              </dd>
            </div>
          )}
          {task.dueDate && (
            <div>
              <dt className="text-sm font-medium text-zinc-500">Vencimento</dt>
              <dd className="text-sm text-zinc-900">
                {new Date(task.dueDate).toLocaleDateString("pt-BR")}
              </dd>
            </div>
          )}
          {task.completedAt && (
            <div>
              <dt className="text-sm font-medium text-zinc-500">Concluída em</dt>
              <dd className="text-sm text-zinc-900">
                {new Date(task.completedAt).toLocaleDateString("pt-BR")}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-zinc-500">Registros de Trabalho</dt>
            <dd className="text-sm text-zinc-900 tabular-nums">{task._count.workLogs}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Total de Horas</dt>
            <dd className="text-sm text-zinc-900 tabular-nums">{Number(task.totalHours).toFixed(2)}h</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Link
            href={`/services/${serviceId}`}
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-blue-600"
          >
            ← Voltar ao serviço
          </Link>
          <Link
            href={`/services/${serviceId}/tasks/${taskId}/edit`}
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-blue-600"
          >
            Editar tarefa →
          </Link>
          <Link
            href={`/services/${serviceId}/tasks/${taskId}/work-logs`}
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-blue-600"
          >
            Registros de trabalho ({task._count.workLogs})
          </Link>
        </div>
        <DeleteTaskForm action={handleDelete} workLogCount={task._count.workLogs} />
      </div>
    </div>
  );
}
