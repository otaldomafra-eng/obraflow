import type { listWorkLogs } from "@/features/work-logs/actions";

interface WorkLogListProps {
  data: Awaited<ReturnType<typeof listWorkLogs>>;
}

export function WorkLogList({ data }: WorkLogListProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Resumo
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Data
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Horas
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.map((log) => (
            <tr key={log.id} className="hover:bg-zinc-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                {log.summary}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {new Date(log.performedAt).toLocaleString("pt-BR")}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-600">
                {log.hours?.toString() ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-zinc-400">
          Nenhum registro de trabalho.
        </div>
      )}
    </div>
  );
}