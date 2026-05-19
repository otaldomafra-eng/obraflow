"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ServiceOption {
  id: string;
  title: string;
  client: { name: string };
}

interface ProposalOption {
  id: string;
  title: string;
}

interface DocumentFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  services: ServiceOption[];
  proposals?: ProposalOption[];
  document?: {
    serviceId: string;
    proposalId?: string | null;
    title: string;
    url: string;
    visibility: string;
    mimeType: string | null;
  };
}

export function DocumentForm({ action, services, proposals, document: doc }: DocumentFormProps) {
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
    if (state?.redirectUrl) router.push(state.redirectUrl);
  }, [state, router]);

  const hasFixedService = doc || preselectedServiceId;
  const fixedService = hasFixedService
    ? services.find((s) => s.id === (doc?.serviceId ?? preselectedServiceId))
    : null;

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Serviço" id="serviceId">
        {hasFixedService ? (
          <>
            <input
              type="hidden"
              name="serviceId"
              value={doc?.serviceId ?? preselectedServiceId ?? ""}
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
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.title} — {s.client.name}</option>
            ))}
          </select>
        )}
      </Field>

      {(proposals && proposals.length > 0) || doc?.proposalId || preselectedProposalId ? (
        <Field label="Proposta (opcional)" id="proposalId">
          <input
            type="hidden"
            name="proposalId"
            value={doc?.proposalId ?? preselectedProposalId ?? ""}
          />
          <input
            id="proposalId"
            readOnly
            value={
              proposals && (doc?.proposalId ?? preselectedProposalId)
                ? proposals.find((p) => p.id === (doc?.proposalId ?? preselectedProposalId))?.title ?? ""
                : ""
            }
            className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
          />
        </Field>
      ) : null}

      <Field label="Título *" id="title">
        <input
          id="title"
          name="title"
          required
          defaultValue={doc?.title ?? ""}
          placeholder="Ex: Memorial Descritivo"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <Field label="URL do Arquivo *" id="url">
        <input
          id="url"
          name="url"
          type="url"
          required
          defaultValue={doc?.url ?? ""}
          placeholder="https://storage.example.com/documento.pdf"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Visibilidade" id="visibility">
          <select
            id="visibility"
            name="visibility"
            defaultValue={doc?.visibility ?? "INTERNAL"}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="INTERNAL">Interno</option>
            <option value="CLIENT_VISIBLE">Visível ao Cliente</option>
            <option value="SUPPLIER_VISIBLE">Visível ao Fornecedor</option>
          </select>
        </Field>
        <Field label="Tipo (opcional)" id="mimeType">
          <input
            id="mimeType"
            name="mimeType"
            defaultValue={doc?.mimeType ?? ""}
            placeholder="Ex: application/pdf"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Salvando..." : doc ? "Salvar Documento" : "Adicionar Documento"}
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
