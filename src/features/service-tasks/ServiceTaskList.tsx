import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { taskStatusLabels, taskStatusColors } from "@/components/ui/status";
import type { listServiceTasks } from "@/features/service-tasks/actions";

interface ServiceTaskListProps {
  data: Awaited<ReturnType<typeof listServiceTasks>>;
  serviceId: string;
}

export function ServiceTaskList({ data, serviceId }: ServiceTaskListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead>
          <tr className="border-b border-zinc-100">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Tarefa
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Vencimento
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Registros
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.map((task) => (
            <tr key={task.id} className="hover:bg-zinc-50 transition-colors">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                <Link
                  href={`/services/${serviceId}/tasks/${task.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {task.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <StatusBadge status={task.status} labels={taskStatusLabels} colors={taskStatusColors} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("pt-BR")
                  : "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-zinc-600">
                {task._count.workLogs}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.008v.008H9V12Zm0-3h.008v.008H9V9Zm3 3h.008v.008H12V12Zm0-3h.008v.008H12V9Zm3 3h.008v.008H15V12Zm0-3h.008v.008H15V9Z" />
          </svg>
          <p className="text-sm text-zinc-400">Nenhuma tarefa criada ainda.</p>
          <span className="mt-2 text-xs text-zinc-400">
            Use o formulário de nova tarefa no detalhe do serviço.
          </span>
        </div>
      )}
    </div>
  );
}
