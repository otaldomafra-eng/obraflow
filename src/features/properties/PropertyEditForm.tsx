"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PropertyEditFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  propertyId: string;
  defaultValues: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    notes: string;
  };
}

export function PropertyEditForm({ action, propertyId, defaultValues }: PropertyEditFormProps) {
  const router = useRouter();
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
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Nome do Imóvel *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues.name}
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
          defaultValue={defaultValues.address}
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
            defaultValue={defaultValues.city}
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
            defaultValue={defaultValues.state}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div>
        <label htmlFor="postalCode" className="block text-sm font-medium text-zinc-700">
          CEP
        </label>
        <input
          id="postalCode"
          name="postalCode"
          defaultValue={defaultValues.postalCode}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">
          Observações
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues.notes}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Salvar
        </button>
        <a
          href={`/properties/${propertyId}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
