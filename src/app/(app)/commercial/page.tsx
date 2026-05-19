import Link from "next/link";

import { getCommercialMetrics } from "@/features/commercial/actions";
import { ProposalStatusBadge } from "@/features/proposals/ProposalStatusBadge";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function CommercialPage() {
  const tenantId = await requireTenantId();
  const metrics = await getCommercialMetrics(tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Comercial
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pipeline comercial e acompanhamento de propostas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          label="Total de Propostas"
          value={metrics.totalProposals.toString()}
        />
        <MetricCard
          label="Valor em Aberto"
          value={formatCurrency(metrics.openValue)}
          sub={`${metrics.draftCount + metrics.sentCount} propostas`}
        />
        <MetricCard
          label="Valor Aceito"
          value={formatCurrency(metrics.acceptedValue)}
          sub={`${metrics.acceptedCount} propostas`}
        />
        <MetricCard
          label="Enviadas"
          value={metrics.sentCount.toString()}
          href="/proposals?status=SENT"
        />
        <MetricCard
          label="Aceitas"
          value={metrics.acceptedCount.toString()}
          href="/proposals?status=ACCEPTED"
        />
        <MetricCard
          label="Recusadas / Canceladas"
          value={metrics.rejectedCanceledCount.toString()}
        />
        <MetricCard
          label="Vencidas"
          value={metrics.expiredCount.toString()}
        />
      </div>

      {metrics.recentProposals.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Propostas em Aberto
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {metrics.recentProposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}`}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {proposal.title}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {proposal.service.client.name} —{" "}
                    {proposal.service.title}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <ProposalStatusBadge status={proposal.status} />
                  <span className="text-sm tabular-nums text-zinc-900">
                    {proposal.totalAmount
                      ? formatCurrency(Number(proposal.totalAmount))
                      : "—"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <Link
          href="/proposals"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Ver todas as propostas →
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-900 tabular-nums">
        {value}
      </dd>
      {sub && <dd className="mt-0.5 text-xs text-zinc-400">{sub}</dd>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
