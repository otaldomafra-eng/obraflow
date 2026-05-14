"use client";

interface DeleteTaskFormProps {
  action: () => Promise<void>;
  workLogCount: number;
}

export function DeleteTaskForm({ action, workLogCount }: DeleteTaskFormProps) {
  const hasWorkLogs = workLogCount > 0;

  return (
    <form
      action={action}
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
          disabled={hasWorkLogs}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-50"
        >
          {hasWorkLogs ? "Deleção bloqueada" : "Deletar tarefa"}
        </button>
      </div>
    </form>
  );
}