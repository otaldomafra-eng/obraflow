"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PropertyNewFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  clients: { id: string; name: string }[];
  initialClientId?: string;
}

export function PropertyNewForm({ action, clients, initialClientId }: PropertyNewFormProps) {
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState(initialClientId ?? "");
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
    <form action={formAction} className="space-y-4">
      {isPending && (
        <div className="text-sm text-zinc-500">Salvando...</div>
      )}
      <div>
        <label htmlFor="clientId" className="block text-sm font-medium text-zinc-700">
          Cliente *
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          <option value="">Selecione um cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Salvar Imóvel
        </button>
        <Link
          href="/properties"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
