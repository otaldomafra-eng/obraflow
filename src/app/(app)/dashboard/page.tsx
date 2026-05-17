import Link from "next/link";

import { getDashboardData } from "@/features/dashboard/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  NEW: "Novo",
  PROPOSAL: "Proposta",
  AWAITING_ACCEPTANCE: "Aguardando Aceite",
  CONTRACTED: "Contratado",
  PLANNING: "Planejamento",
  PRODUCTION: "Produção",
  APPROVAL: "Aprovação",
  WORK: "Em Obra",
  AWAITING_CLIENT: "Aguardando Cliente",
  PAUSED: "Pausado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

const statusColors: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-700",
  PROPOSAL: "bg-blue-50 text-blue-700",
  AWAITING_ACCEPTANCE: "bg-yellow-50 text-yellow-700",
  CONTRACTED: "bg-green-50 text-green-700",
  PLANNING: "bg-purple-50 text-purple-700",
  PRODUCTION: "bg-indigo-50 text-indigo-700",
  APPROVAL: "bg-orange-50 text-orange-700",
  WORK: "bg-cyan-50 text-cyan-700",
  AWAITING_CLIENT: "bg-teal-50 text-teal-700",
  PAUSED: "bg-zinc-100 text-zinc-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELED: "bg-red-50 text-red-700",
};

export default async function DashboardPage() {
  const tenantId = await requireTenantId();
  const data = await getDashboardData(tenantId);

  const hasData = data.clientCount > 0 || data.serviceCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
        <p className="mt-1 text-sm text-zinc-500">Visão executiva da operação.</p>
      </div>

      {!hasData ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-sm text-zinc-400">
            Nenhum dado encontrado. Comece cadastrando um{" "}
            <Link href="/clients/new" className="font-medium text-zinc-900 underline hover:text-zinc-600">
              cliente
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/clients"
              className="rounded-xl border bg-white p-6 transition-colors hover:bg-zinc-50"
            >
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Clientes
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-zinc-900">
                {data.clientCount}
              </dd>
            </Link>
            <Link
              href="/properties"
              className="rounded-xl border bg-white p-6 transition-colors hover:bg-zinc-50"
            >
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Imóveis
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-zinc-900">
                {data.propertyCount}
              </dd>
            </Link>
            <Link
              href="/services"
              className="rounded-xl border bg-white p-6 transition-colors hover:bg-zinc-50"
            >
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Serviços
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-zinc-900">
                {data.serviceCount}
              </dd>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold">Serviços por Status</h2>
              {data.servicesByStatus.length === 0 ? (
                <p className="text-sm text-zinc-400">Nenhum serviço cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {data.servicesByStatus.map((s) => (
                    <Link
                      key={s.status}
                      href={`/services?status=${s.status}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50"
                    >
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[s.status] || "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {statusLabels[s.status] || s.status}
                      </span>
                      <span className="text-sm font-medium text-zinc-900">
                        {s.count}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold">Próximos Vencimentos</h2>
              {data.upcomingDueDates.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  Nenhum serviço com vencimento próximo.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.upcomingDueDates.map((svc) => (
                    <li key={svc.id}>
                      <Link
                        href={`/services/${svc.id}`}
                        className="block rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50"
                      >
                        <div className="text-sm font-medium text-zinc-900">
                          {svc.title}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {svc.client.name} &mdash;{" "}
                          {svc.dueDate
                            ? new Date(svc.dueDate).toLocaleDateString("pt-BR")
                            : "Sem vencimento"}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Serviços Recentes</h2>
              <Link
                href="/services"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Ver todos
              </Link>
            </div>
            {data.recentServices.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhum serviço cadastrado.</p>
            ) : (
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Serviço
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Cliente
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.recentServices.map((svc) => (
                    <tr key={svc.id} className="hover:bg-zinc-50">
                      <td className="px-3 py-2 text-sm font-medium text-zinc-900">
                        <Link
                          href={`/services/${svc.id}`}
                          className="hover:underline"
                        >
                          {svc.title}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-sm text-zinc-600">
                        {svc.client.name}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            statusColors[svc.status] || "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {statusLabels[svc.status] || svc.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-zinc-500">
                        {new Date(svc.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
