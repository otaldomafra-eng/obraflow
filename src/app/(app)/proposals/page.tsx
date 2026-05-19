import Link from "next/link";

import { ProposalList } from "@/features/proposals/ProposalList";
import { listProposals } from "@/features/proposals/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "", label: "Todas" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "SENT", label: "Enviada" },
  { value: "ACCEPTED", label: "Aceita" },
  { value: "REJECTED", label: "Recusada" },
  { value: "CANCELED", label: "Cancelada" },
] as const;

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const tenantId = await requireTenantId();
  const params = await searchParams;

  const proposals = await listProposals(tenantId, {
    status: params.status || undefined,
    search: params.search || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Propostas
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie propostas comerciais vinculadas a serviços.
          </p>
        </div>
        <Link
          href="/proposals/new"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800"
        >
          Nova Proposta
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => {
          const href = value ? `/proposals?status=${value}` : "/proposals";
          const isActive = value
            ? params.status === value
            : !params.status;
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <ProposalList proposals={proposals} />
    </div>
  );
}
