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
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead>
          <tr className="border-b border-zinc-100">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Resumo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Data
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Horas
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.map((log) => (
            <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
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
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-zinc-600">
                    {log.hours ? `${Number(log.hours).toFixed(2)}h` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(log.id)}
                        className="text-xs font-medium text-zinc-500 hover:text-blue-600 transition-colors"
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
                            className="text-xs font-medium text-zinc-500 hover:text-blue-600 transition-colors"
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
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="text-sm text-zinc-400">Nenhum registro de trabalho.</p>
          <span className="mt-2 text-xs text-zinc-400">
            Crie um novo registro usando o formulário ao lado.
          </span>
        </div>
      )}
    </div>
  );
}
