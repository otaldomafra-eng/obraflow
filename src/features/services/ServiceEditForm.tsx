"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ServiceEditFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  serviceId: string;
  defaultValues: {
    title: string;
    status: string;
    description: string;
    startDate: string;
    dueDate: string;
  };
}

const statusOptions = [
  { value: "NEW", label: "Novo" },
  { value: "PROPOSAL", label: "Proposta" },
  { value: "AWAITING_ACCEPTANCE", label: "Aguardando Aceite" },
  { value: "CONTRACTED", label: "Contratado" },
  { value: "PLANNING", label: "Planejamento" },
  { value: "PRODUCTION", label: "Produção" },
  { value: "APPROVAL", label: "Aprovação" },
  { value: "WORK", label: "Em Obra" },
  { value: "AWAITING_CLIENT", label: "Aguardando Cliente" },
  { value: "PAUSED", label: "Pausado" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELED", label: "Cancelado" },
];

export function ServiceEditForm({ action, serviceId, defaultValues }: ServiceEditFormProps) {
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
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700">
          Título *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues.title}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-zinc-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues.status}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues.description}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700">
            Data de Início
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={defaultValues.startDate}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-zinc-700">
            Data de Entrega
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaultValues.dueDate}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Salvar
        </button>
        <a
          href={`/services/${serviceId}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
