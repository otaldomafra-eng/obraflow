import Link from "next/link";

import { getDashboardData } from "@/features/dashboard/actions";
import { requireTenantId } from "@/server/auth/tenant";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tenantId = await requireTenantId();
  const data = await getDashboardData(tenantId);

  const hasData = data.clientCount > 0 || data.serviceCount > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Painel</h1>
        <p className="mt-1 text-sm text-zinc-500">Visão executiva da operação.</p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-16">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
            <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">
            Nenhum dado encontrado. Comece cadastrando um{" "}
            <Link href="/clients/new" className="font-medium text-blue-600 hover:text-blue-700">
              cliente
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              href="/clients"
              label="Clientes"
              value={data.clientCount}
            />
            <MetricCard
              href="/properties"
              label="Imóveis"
              value={data.propertyCount}
            />
            <MetricCard
              href="/services"
              label="Serviços"
              value={data.serviceCount}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-6 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">Serviços por Status</h2>
              </div>
              <div className="p-6">
                {data.servicesByStatus.length === 0 ? (
                  <p className="text-sm text-zinc-400">Nenhum serviço cadastrado.</p>
                ) : (
                  <div className="space-y-2">
                    {data.servicesByStatus.map((s) => (
                      <Link
                        key={s.status}
                        href={`/services?status=${s.status}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50"
                      >
                        <StatusBadge status={s.status} />
                        <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                          {s.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-6 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">Próximos Vencimentos</h2>
              </div>
              <div className="p-6">
                {data.upcomingDueDates.length === 0 ? (
                  <p className="text-sm text-zinc-400">Nenhum serviço com vencimento próximo.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.upcomingDueDates.map((svc) => (
                      <li key={svc.id}>
                        <Link
                          href={`/services/${svc.id}`}
                          className="block rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50"
                        >
                          <div className="text-sm font-medium text-zinc-900">
                            {svc.title}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                            <span>{svc.client.name}</span>
                            <span className="text-zinc-300">|</span>
                            <span>
                              {svc.dueDate
                                ? new Date(svc.dueDate).toLocaleDateString("pt-BR")
                                : "Sem vencimento"}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">Tarefas Pendentes</h2>
                <span className="inline-flex items-center justify-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                  {data.pendingTasks.length}
                </span>
              </div>
              <div className="p-6">
                {data.pendingTasks.length === 0 ? (
                  <p className="text-sm text-zinc-400">Nenhuma tarefa pendente.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.pendingTasks.map((task) => (
                      <li key={task.id}>
                        <Link
                          href={`/services/${task.serviceId}/tasks/${task.id}`}
                          className="block rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50"
                        >
                          <div className="text-sm font-medium text-zinc-900">
                            {task.title}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-500">
                            {task.serviceTitle}
                            {task.dueDate && (
                              <> &mdash; {new Date(task.dueDate).toLocaleDateString("pt-BR")}</>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">Tarefas Atrasadas</h2>
                <span className="inline-flex items-center justify-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                  {data.overdueTasks.length}
                </span>
              </div>
              <div className="p-6">
                {data.overdueTasks.length === 0 ? (
                  <p className="text-sm text-zinc-400">Nenhuma tarefa atrasada.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.overdueTasks.map((task) => (
                      <li key={task.id}>
                        <Link
                          href={`/services/${task.serviceId}/tasks/${task.id}`}
                          className="block rounded-lg px-3 py-2 transition-colors hover:bg-rose-50"
                        >
                          <div className="text-sm font-medium text-zinc-900">
                            {task.title}
                          </div>
                          <div className="mt-0.5 text-xs text-rose-600">
                            {task.serviceTitle}
                            {task.dueDate && (
                              <> &mdash; Venceu {new Date(task.dueDate).toLocaleDateString("pt-BR")}</>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-zinc-900">Serviços Recentes</h2>
              <Link
                href="/services"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Ver todos &rarr;
              </Link>
            </div>
            {data.recentServices.length === 0 ? (
              <div className="px-6 py-8 text-sm text-zinc-400">Nenhum serviço cadastrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Serviço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {data.recentServices.map((svc) => (
                      <tr key={svc.id} className="transition-colors hover:bg-zinc-50">
                        <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-zinc-900">
                          <Link
                            href={`/services/${svc.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {svc.title}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-sm text-zinc-600">
                          {svc.client.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          <StatusBadge status={svc.status} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-sm text-zinc-500">
                          {new Date(svc.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-zinc-200 bg-white p-6 transition-all duration-150 hover:border-zinc-300 hover:shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 tabular-nums">
        {value}
      </p>
    </Link>
  );
}
