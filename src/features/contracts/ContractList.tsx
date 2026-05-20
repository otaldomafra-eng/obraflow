import Link from "next/link";

import { ContractStatusBadge } from "./ContractStatusBadge";
import type { listContracts } from "./actions";

interface ContractListProps {
  contracts: Awaited<ReturnType<typeof listContracts>>;
}

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function ContractList({ contracts }: ContractListProps) {
  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-16 text-center">
        <svg className="mb-3 h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <p className="text-sm text-zinc-400">Nenhum contrato encontrado.</p>
        <Link
          href="/contracts/new"
          className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Criar Contrato
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead>
          <tr className="border-b border-zinc-100">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Nº</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Cliente</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Serviço</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Proposta</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Assinatura</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {contracts.map((contract) => (
            <tr key={contract.id} className="hover:bg-zinc-50 transition-colors">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-mono font-medium text-zinc-900">
                {contract.number}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {contract.service.client.name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {contract.service.title}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {contract.proposal ? contract.proposal.title : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <ContractStatusBadge status={contract.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {formatDate(contract.signedAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                <Link
                  href={`/contracts/${contract.id}`}
                  className="font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
                >
                  Abrir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
