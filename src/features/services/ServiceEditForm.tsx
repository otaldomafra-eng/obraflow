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
    <form action={formAction} className="space-y-5">
      {isPending && (
        <div className="rounded-lg bg-zinc-50 px-4 py-2 text-sm text-zinc-600">
          Salvando...
        </div>
      )}
      <Field label="Título *" id="title">
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues.title}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <Field label="Status" id="status">
        <select
          id="status"
          name="status"
          defaultValue={defaultValues.status}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Descrição" id="description">
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues.description}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Data de Início" id="startDate">
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={defaultValues.startDate}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
        <Field label="Data de Entrega" id="dueDate">
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaultValues.dueDate}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salvar
        </button>
        <a
          href={`/services/${serviceId}`}
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
