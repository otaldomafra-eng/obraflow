"use client";

interface WorkLogEditFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues: {
    summary: string;
    description: string | null;
    performedAt: string;
    hours: number | null;
  };
  onCancel: () => void;
}

export function WorkLogEditForm({ action, defaultValues, onCancel }: WorkLogEditFormProps) {
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-zinc-700">
          Resumo *
        </label>
        <input
          id="summary"
          name="summary"
          required
          defaultValue={defaultValues.summary}
          className="mt-0.5 block w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={defaultValues.description ?? ""}
          className="mt-0.5 block w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="performedAt" className="block text-sm font-medium text-zinc-700">
            Data/Hora *
          </label>
          <input
            id="performedAt"
            name="performedAt"
            type="datetime-local"
            required
            defaultValue={defaultValues.performedAt}
            className="mt-0.5 block w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
            defaultValue={defaultValues.hours?.toString() ?? ""}
            className="mt-0.5 block w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
