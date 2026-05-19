import Link from "next/link";

import type { getProposal } from "./actions";
import { ProposalStatusBadge } from "./ProposalStatusBadge";

interface ProposalDetailProps {
  proposal: NonNullable<Awaited<ReturnType<typeof getProposal>>>;
}

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function ProposalDetail({ proposal }: ProposalDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {proposal.title}
          </h1>
          <ProposalStatusBadge status={proposal.status} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">Informações</h2>
        <dl className="divide-y divide-zinc-100">
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Cliente</dt>
            <dd className="text-sm text-zinc-900">
              <Link
                href={`/clients/${proposal.service.client.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {proposal.service.client.name}
              </Link>
            </dd>
          </div>
          {proposal.service.property && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Imóvel</dt>
              <dd className="text-sm text-zinc-900">
                <Link
                  href={`/properties/${proposal.service.property.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {proposal.service.property.name}
                </Link>
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Serviço</dt>
            <dd className="text-sm text-zinc-900">
              <Link
                href={`/services/${proposal.service.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {proposal.service.title}
              </Link>
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Valor</dt>
            <dd className="text-sm text-zinc-900 tabular-nums">
              {proposal.totalAmount
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(parseFloat(proposal.totalAmount.toString()))
                : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Validade</dt>
            <dd className="text-sm text-zinc-900">{formatDate(proposal.validUntil)}</dd>
          </div>
          {proposal.sentAt && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Enviada em</dt>
              <dd className="text-sm text-zinc-900">{formatDate(proposal.sentAt)}</dd>
            </div>
          )}
          {proposal.acceptedAt && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Aceita em</dt>
              <dd className="text-sm text-zinc-900">{formatDate(proposal.acceptedAt)}</dd>
            </div>
          )}
        </dl>
      </div>

      {proposal.notes && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Observações / Escopo</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{proposal.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/services/${proposal.service.id}`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            ← Voltar ao serviço
          </Link>
          <Link
            href="/proposals"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            ← Todas as propostas
          </Link>
        </div>
        <Link
          href={`/proposals/${proposal.id}/edit`}
          className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Editar proposta →
        </Link>
      </div>
    </div>
  );
}
