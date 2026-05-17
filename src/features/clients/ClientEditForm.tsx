"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ClientEditFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  clientId: string;
  defaultValues: {
    name: string;
    kind: string;
    document: string;
    email: string;
    phone: string;
    notes: string;
  };
}

export function ClientEditForm({ action, clientId, defaultValues }: ClientEditFormProps) {
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
          Nome *
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
        <label htmlFor="kind" className="block text-sm font-medium text-zinc-700">
          Tipo
        </label>
        <select
          id="kind"
          name="kind"
          defaultValue={defaultValues.kind}
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
          defaultValue={defaultValues.document}
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
          defaultValue={defaultValues.email}
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
          defaultValue={defaultValues.phone}
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
          href={`/clients/${clientId}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
