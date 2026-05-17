import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { typeLabels } from "@/components/ui/status";
import type { listServices } from "@/features/services/actions";

interface ServiceListProps {
  data: Awaited<ReturnType<typeof listServices>>;
}

export function ServiceList({ data }: ServiceListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead>
          <tr className="border-b border-zinc-100">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Serviço
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Cliente
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Imóvel
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Tarefas
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Docs
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.items.map((service) => (
            <tr key={service.id} className="hover:bg-zinc-50 transition-colors">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                <Link
                  href={`/services/${service.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {service.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {typeLabels[service.type] || service.type}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                <Link
                  href={`/clients/${service.client.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {service.client.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {service.property ? (
                  <Link
                    href={`/properties/${service.property.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {service.property.name}
                  </Link>
                ) : (
                  "-"
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <StatusBadge status={service.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-zinc-600">
                {service._count.tasks}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-zinc-600">
                {service._count.documents}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/services/${service.id}`}
                  className="text-sm font-medium text-zinc-500 transition-colors hover:text-blue-600"
                >
                  Detalhes
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.items.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17a5.25 5.25 0 0 0 7.41-7.41M9 12h.008v.008H9V12Zm0-3h.008v.008H9V9Zm3 3h.008v.008H12V12Zm0-3h.008v.008H12V9Zm3 3h.008v.008H15V12Zm0-3h.008v.008H15V9Z" />
          </svg>
          <p className="text-sm text-zinc-400">Nenhum serviço encontrado.</p>
        </div>
      )}
    </div>
  );
}
