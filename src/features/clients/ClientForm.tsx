"use client";

interface ClientFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function ClientForm({ action }: ClientFormProps) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Nome *
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="kind" className="block text-sm font-medium text-zinc-700">
          Tipo
        </label>
        <select
          id="kind"
          name="kind"
          defaultValue="PERSON"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          <option value="PERSON">Pessoa Física</option>
          <option value="COMPANY">Pessoa Jurídica</option>
        </select>
      </div>

      <div>
        <label htmlFor="document" className="block text-sm font-medium text-zinc-700">
          CPF/CNPJ
        </label>
        <input
          id="document"
          name="document"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">
          Telefone
        </label>
        <input
          id="phone"
          name="phone"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Salvar Cliente
      </button>
    </form>
  );
}
