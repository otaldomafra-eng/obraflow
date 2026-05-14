import Link from "next/link";

import type { listServiceTasks } from "@/features/service-tasks/actions";

interface ServiceTaskListProps {
  data: Awaited<ReturnType<typeof listServiceTasks>>;
  serviceId: string;
}

const statusColors: Record<string, string> = {
  PLANNING: "bg-purple-50 text-purple-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  DONE: "bg-emerald-50 text-emerald-700",
  CANCELED: "bg-red-50 text-red-700",
};

const statusLabels: Record<string, string> = {
  PLANNING: "Planejamento",
  IN_PROGRESS: "Em Andamento",
  DONE: "Concluída",
  CANCELED: "Cancelada",
};

export function ServiceTaskList({ data, serviceId }: ServiceTaskListProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tarefa
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Vencimento
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Registros
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.map((task) => (
            <tr key={task.id} className="hover:bg-zinc-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                <Link
                  href={`/services/${serviceId}/tasks/${task.id}`}
                  className="hover:underline"
                >
                  {task.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusColors[task.status] || "bg-gray-50 text-gray-600"
                  }`}
                >
                  {statusLabels[task.status] || task.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("pt-BR")
                  : "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-600">
                {task._count.workLogs}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-zinc-400">
          Nenhuma tarefa criada ainda.
        </div>
      )}
    </div>
  );
}