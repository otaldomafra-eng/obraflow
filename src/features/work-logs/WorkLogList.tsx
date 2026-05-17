"use client";

import { useState } from "react";
import type { listWorkLogs } from "@/features/work-logs/actions";
import { WorkLogEditForm } from "@/features/work-logs/WorkLogEditForm";

interface WorkLogListProps {
  data: Awaited<ReturnType<typeof listWorkLogs>>;
  onEdit: (workLogId: string, formData: FormData) => Promise<void>;
  onDelete: (workLogId: string) => Promise<void>;
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("pt-BR");
}

function toDatetimeLocal(date: Date) {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function WorkLogList({ data, onEdit, onDelete }: WorkLogListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.map((log) => (
            <tr key={log.id} className="hover:bg-zinc-50">
              {editingId === log.id ? (
                <td colSpan={4} className="px-4 py-3">
                  <WorkLogEditForm
                    action={(formData) => onEdit(log.id, formData)}
                    defaultValues={{
                      summary: log.summary,
                      description: log.description,
                      performedAt: toDatetimeLocal(log.performedAt),
                      hours: log.hours ? Number(log.hours) : null,
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </td>
              ) : (
                <>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                    {log.summary}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {formatDateTime(log.performedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-600">
                    {log.hours ? `${Number(log.hours).toFixed(2)}h` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(log.id)}
                        className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
                      >
                        Editar
                      </button>
                      {deletingId === log.id ? (
                        <form
                          action={async () => {
                            await onDelete(log.id);
                            setDeletingId(null);
                          }}
                          className="flex items-center gap-1"
                        >
                          <span className="text-xs text-red-600">Confirmar?</span>
                          <button
                            type="submit"
                            className="text-xs font-medium text-red-600 hover:text-red-800"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
                          >
                            Não
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(log.id)}
                          className="text-xs font-medium text-red-500 hover:text-red-700"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </>
              )}
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
