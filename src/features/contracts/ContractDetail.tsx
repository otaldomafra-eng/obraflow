import Link from "next/link";

import { ContractStatusBadge } from "./ContractStatusBadge";
import type { getContract } from "./actions";

interface ContractDetailProps {
  contract: NonNullable<Awaited<ReturnType<typeof getContract>>>;
}

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function ContractDetail({ contract }: ContractDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Contrato {contract.number}
          </h1>
          <ContractStatusBadge status={contract.status} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">Informações</h2>
        <dl className="divide-y divide-zinc-100">
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Nº do Contrato</dt>
            <dd className="text-sm font-mono font-medium text-zinc-900">{contract.number}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Cliente</dt>
            <dd className="text-sm text-zinc-900">
              <Link
                href={`/clients/${contract.service.client.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {contract.service.client.name}
              </Link>
            </dd>
          </div>
          {contract.service.property && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Imóvel</dt>
              <dd className="text-sm text-zinc-900">
                <Link
                  href={`/properties/${contract.service.property.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {contract.service.property.name}
                </Link>
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Serviço</dt>
            <dd className="text-sm text-zinc-900">
              <Link
                href={`/services/${contract.service.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {contract.service.title}
              </Link>
            </dd>
          </div>
          {contract.proposal && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Proposta</dt>
              <dd className="text-sm text-zinc-900">
                <Link
                  href={`/proposals/${contract.proposal.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {contract.proposal.title}
                </Link>
              </dd>
            </div>
          )}
          {contract.signedAt && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Assinado em</dt>
              <dd className="text-sm text-zinc-900">{formatDate(contract.signedAt)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Criado em</dt>
            <dd className="text-sm text-zinc-900">{formatDate(contract.createdAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/services/${contract.service.id}`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            ← Voltar ao serviço
          </Link>
          <Link
            href="/contracts"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            ← Todos os contratos
          </Link>
        </div>
        <Link
          href={`/contracts/${contract.id}/edit`}
          className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Editar contrato →
        </Link>
      </div>
    </div>
  );
}
