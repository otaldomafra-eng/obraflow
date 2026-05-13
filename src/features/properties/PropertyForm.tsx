"use client";

interface PropertyFormProps {
  action: (formData: FormData) => Promise<void>;
  clientLabel?: string;
}

export function PropertyForm({ action, clientLabel }: PropertyFormProps) {
  return (
    <form action={action} className="space-y-4">
      {clientLabel && (
        <div className="text-sm text-zinc-500">Cliente: {clientLabel}</div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Nome do Imóvel *
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-zinc-700">
          Endereço
        </label>
        <input
          id="address"
          name="address"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-zinc-700">
            Cidade
          </label>
          <input
            id="city"
            name="city"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-zinc-700">
            Estado
          </label>
          <input
            id="state"
            name="state"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Salvar Imóvel
      </button>
    </form>
  );
}
