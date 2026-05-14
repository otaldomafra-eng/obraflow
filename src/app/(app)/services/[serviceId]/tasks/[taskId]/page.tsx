import Link from "next/link";
import { notFound } from "next/navigation";

import { getServiceTask } from "@/features/service-tasks/actions";
import { requireTenantId } from "@/server/auth/tenant";

const statusLabels: Record<string, string> = {
  PLANNING: "Planejamento",
  PRODUCTION: "Em Produção",
  DELIVERED: "Entregue",
  CANCELED: "Cancelada",
};

const statusColors: Record<string, string> = {
  PLANNING: "bg-purple-50 text-purple-700",
  PRODUCTION: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELED: "bg-red-50 text-red-700",
};

export default async function ServiceTaskDetailPage({
  params,
}: {
  params: Promise<{ serviceId: string; taskId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { serviceId, taskId } = await params;

  const task = await getServiceTask(tenantId, taskId);

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Tarefa do serviço #{serviceId.slice(0, 8)}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            statusColors[task.status] || "bg-gray-50 text-gray-600"
          }`}
        >
          {statusLabels[task.status] || task.status}
        </span>
      </div>

      <div className="rounded-xl border bg-white p-6">
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
          <div>
            <dt className="text-sm font-medium text-zinc-500">Registros de Trabalho</dt>
            <dd className="text-sm text-zinc-900">{task._count.workLogs}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-4">
        <Link
          href={`/services/${serviceId}`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:underline"
        >
          ← Voltar ao serviço
        </Link>
        <Link
          href={`/services/${serviceId}/tasks/${taskId}/edit`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:underline"
        >
          Editar tarefa →
        </Link>
      </div>
    </div>
  );
}