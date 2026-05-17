"use client";

interface PropertyFormProps {
  action: (formData: FormData) => Promise<void>;
  clientLabel?: string;
}

export function PropertyForm({ action, clientLabel }: PropertyFormProps) {
  return (
    <form action={action} className="space-y-5">
      {clientLabel && (
        <p className="text-sm text-zinc-500">Cliente: {clientLabel}</p>
      )}

      <Field label="Nome do Imóvel *" id="name">
        <input
          id="name"
          name="name"
          required
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <Field label="Endereço" id="address">
        <input
          id="address"
          name="address"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cidade" id="city">
          <input
            id="city"
            name="city"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
        <Field label="Estado" id="state">
          <input
            id="state"
            name="state"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800"
      >
        Salvar Imóvel
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
