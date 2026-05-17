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
    <form action={formAction} className="space-y-5">
      {isPending && (
        <div className="rounded-lg bg-zinc-50 px-4 py-2 text-sm text-zinc-600">
          Salvando...
        </div>
      )}
      <Field label="Nome do Imóvel *" id="name">
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues.name}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <Field label="Endereço" id="address">
        <input
          id="address"
          name="address"
          defaultValue={defaultValues.address}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cidade" id="city">
          <input
            id="city"
            name="city"
            defaultValue={defaultValues.city}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
        <Field label="Estado" id="state">
          <input
            id="state"
            name="state"
            defaultValue={defaultValues.state}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      </div>

      <Field label="CEP" id="postalCode">
        <input
          id="postalCode"
          name="postalCode"
          defaultValue={defaultValues.postalCode}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <Field label="Observações" id="notes">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues.notes}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salvar
        </button>
        <a
          href={`/properties/${propertyId}`}
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Cancelar
        </a>
      </div>
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
