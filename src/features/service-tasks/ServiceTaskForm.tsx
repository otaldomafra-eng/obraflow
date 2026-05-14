"use client";

interface ServiceTaskFormProps {
  action: (formData: FormData) => Promise<void>;
  serviceId: string;
  task?: {
    title: string;
    description: string | null;
    status: string;
    dueDate: string | null;
  };
}

const taskStatuses = [
  { value: "PLANNING", label: "Planejamento" },
  { value: "PRODUCTION", label: "Em Produção" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELED", label: "Cancelada" },
];

export function ServiceTaskForm({
  action,
  serviceId,
  task,
}: ServiceTaskFormProps) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700">
          Título *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={task?.title ?? ""}
          placeholder="Ex: Preparar base de concreto"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={task?.description ?? ""}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-zinc-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={task?.status ?? "PLANNING"}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            {taskStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-zinc-700">
            Vencimento
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={task?.dueDate ?? ""}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      <input name="serviceId" type="hidden" value={serviceId} />

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Salvar Tarefa
      </button>
    </form>
  );
}