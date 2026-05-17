"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DeleteTaskFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  workLogCount: number;
}

export function DeleteTaskForm({ action, workLogCount }: DeleteTaskFormProps) {
  const router = useRouter();
  const hasWorkLogs = workLogCount > 0;
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null as { redirectUrl?: string } | null,
  );

  useEffect(() => {
    if (state?.redirectUrl) {
      router.push(state.redirectUrl);
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (hasWorkLogs) {
          e.preventDefault();
          return;
        }
        const confirmed = window.confirm(
          "Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita.",
        );
        if (!confirmed) {
          e.preventDefault();
        }
      }}
    >
      <div className="flex flex-col items-end gap-1">
        {hasWorkLogs && (
          <span className="text-xs text-zinc-500">
            Tarefas com histórico não podem ser deletadas. Altere o status para CANCELADO.
          </span>
        )}
        <button
          type="submit"
          disabled={hasWorkLogs || isPending}
          className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 transition-all duration-150 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hasWorkLogs ? "Deleção bloqueada" : "Deletar tarefa"}
        </button>
      </div>
    </form>
  );
}
