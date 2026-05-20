"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ContractFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  services: { id: string; title: string; client: { name: string } }[];
  contract?: {
    serviceId: string;
    status: string;
    number: string;
  };
}

export function ContractForm({ action, services, contract }: ContractFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("serviceId");
  const preselectedProposalId = searchParams.get("proposalId");

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

  const isEdit = !!contract;
  const effectiveServiceId = contract?.serviceId ?? preselectedServiceId;
  const isServiceFixed = isEdit || !!preselectedServiceId;

  const fixedService = isServiceFixed && effectiveServiceId
    ? services.find((s) => s.id === effectiveServiceId)
    : null;

  return (
    <form action={formAction} className="space-y-5">
      {isServiceFixed && (
        <input type="hidden" name="serviceId" value={effectiveServiceId ?? ""} />
      )}

      {!isEdit && preselectedProposalId && (
        <input type="hidden" name="proposalId" value={preselectedProposalId} />
      )}

      <Field label="Serviço" id="serviceId">
        {isServiceFixed ? (
          <input
            id="serviceId"
            readOnly
            value={
              fixedService
                ? `${fixedService.title} — ${fixedService.client.name}`
                : "Carregando..."
            }
            className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
          />
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

      {!isEdit && !preselectedProposalId && (
        <Field label="Proposta (opcional)" id="proposalId">
          <select
            id="proposalId"
            name="proposalId"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">Nenhuma</option>
          </select>
        </Field>
      )}

      <Field label="Status" id="status">
        <select
          id="status"
          name="status"
          defaultValue={contract?.status ?? "DRAFT"}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          <option value="DRAFT">Rascunho</option>
          <option value="ISSUED">Emitido</option>
          <option value="SIGNED">Assinado</option>
          <option value="COMPLETED">Concluído</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Salvando..." : isEdit ? "Salvar Contrato" : "Criar Contrato"}
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
