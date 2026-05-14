"use client";

interface DeleteTaskFormProps {
  action: () => Promise<void>;
  workLogCount: number;
}

export function DeleteTaskForm({ action, workLogCount }: DeleteTaskFormProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (workLogCount > 0) {
          e.preventDefault();
          window.alert(
            "Esta tarefa possui registros de trabalho e não pode ser deletada. " +
            "Altere o status para CANCELADO se deseja encerrá-la.",
          );
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
      <button
        type="submit"
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
      >
        Deletar tarefa
      </button>
    </form>
  );
}