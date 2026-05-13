import Link from "next/link";

import type { listServices } from "@/features/services/actions";

interface ServiceListProps {
  data: Awaited<ReturnType<typeof listServices>>;
}

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

const typeLabels: Record<string, string> = {
  TECHNICAL_PROJECT: "Projeto Técnico",
  REGULARIZATION: "Regularização",
  WORK_EXECUTION: "Execução de Obra",
  CONSULTING: "Consultoria",
  FIRE_SAFETY: "Prevenção de Incêndio",
  PROJECT_APPROVAL_WORK: "Aprovação de Projeto",
};

export function ServiceList({ data }: ServiceListProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Serviço
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Cliente
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Imóvel
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tarefas
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Docs
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.items.map((service) => (
            <tr key={service.id} className="hover:bg-zinc-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                <Link
                  href={`/services/${service.id}`}
                  className="hover:underline"
                >
                  {service.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {typeLabels[service.type] || service.type}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {service.client.name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {service.property?.name || "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusColors[service.status] || "bg-gray-50 text-gray-600"
                  }`}
                >
                  {service.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-600">
                {service._count.tasks}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-600">
                {service._count.documents}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/services/${service.id}`}
                  className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
                >
                  Detalhes
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.items.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-zinc-400">
          Nenhum serviço encontrado.
        </div>
      )}
    </div>
  );
}