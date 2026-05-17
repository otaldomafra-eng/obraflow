"use client";

interface WorkLogFormProps {
  action: (formData: FormData) => Promise<void>;
  serviceId: string;
  taskId: string;
}

export function WorkLogForm({ action, serviceId, taskId }: WorkLogFormProps) {
  return (
    <form action={action} className="space-y-5">
      <Field label="Resumo *" id="summary">
        <input
          id="summary"
          name="summary"
          required
          placeholder="Ex: Concluído levantamento topográfico"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <Field label="Descrição" id="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Data/Hora *" id="performedAt">
          <input
            id="performedAt"
            name="performedAt"
            type="datetime-local"
            required
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
        <Field label="Horas" id="hours">
          <input
            id="hours"
            name="hours"
            type="number"
            step="0.25"
            min="0"
            placeholder="Ex: 2.5"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      </div>

      <input name="serviceId" type="hidden" value={serviceId} />
      <input name="taskId" type="hidden" value={taskId} />

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800"
      >
        Registrar Trabalho
      </button>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
    </div>
  );
}
