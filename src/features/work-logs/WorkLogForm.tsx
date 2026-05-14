"use client";

interface WorkLogFormProps {
  action: (formData: FormData) => Promise<void>;
  serviceId: string;
  taskId: string;
}

export function WorkLogForm({ action, serviceId, taskId }: WorkLogFormProps) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-zinc-700">
          Resumo *
        </label>
        <input
          id="summary"
          name="summary"
          required
          placeholder="Ex: Concluído levantamento topográfico"
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
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="performedAt" className="block text-sm font-medium text-zinc-700">
            Data/Hora *
          </label>
          <input
            id="performedAt"
            name="performedAt"
            type="datetime-local"
            required
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="hours" className="block text-sm font-medium text-zinc-700">
            Horas
          </label>
          <input
            id="hours"
            name="hours"
            type="number"
            step="0.25"
            min="0"
            placeholder="Ex: 2.5"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      <input name="serviceId" type="hidden" value={serviceId} />
      <input name="taskId" type="hidden" value={taskId} />

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Registrar Trabalho
      </button>
    </form>
  );
}