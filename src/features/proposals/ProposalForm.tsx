"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ProposalFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  services: { id: string; title: string; client: { name: string } }[];
  proposal?: {
    serviceId: string;
    title: string;
    totalAmount: string | null;
    status: string;
    validUntil: string | null;
    notes: string | null;
  };
}

export function ProposalForm({ action, services, proposal }: ProposalFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("serviceId");

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

  const hasFixedService = proposal || preselectedServiceId;
  const fixedService = hasFixedService
    ? services.find(
        (s) => s.id === (proposal?.serviceId ?? preselectedServiceId),
      )
    : null;

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Serviço" id="serviceId">
        {hasFixedService ? (
          <>
            <input
              type="hidden"
              name="serviceId"
              value={proposal?.serviceId ?? preselectedServiceId ?? ""}
            />
            <input
              id="serviceId"
              readOnly
              value={fixedService ? `${fixedService.title} — ${fixedService.client.name}` : "Carregando..."}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
            />
          </>
        ) : (
          <select
            id="serviceId"
            name="serviceId"
            required
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">Selecione um serviço</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title} — {service.client.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Título *" id="title">
        <input
          id="title"
          name="title"
          required
          defaultValue={proposal?.title ?? ""}
          placeholder="Ex: Proposta de Projeto Estrutural"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Valor Total" id="totalAmount">
          <input
            id="totalAmount"
            name="totalAmount"
            type="number"
            step="0.01"
            defaultValue={proposal?.totalAmount ?? ""}
            placeholder="0,00"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
        <Field label="Validade" id="validUntil">
          <input
            id="validUntil"
            name="validUntil"
            type="date"
            defaultValue={proposal?.validUntil ?? ""}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      </div>

      <Field label="Observações" id="notes">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={proposal?.notes ?? ""}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Salvando..." : proposal ? "Salvar Proposta" : "Criar Proposta"}
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
