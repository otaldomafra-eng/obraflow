import Link from "next/link";

import type { listClients } from "@/features/clients/actions";

interface ClientListProps {
  data: Awaited<ReturnType<typeof listClients>>;
}

export function ClientList({ data }: ClientListProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Nome
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Documento
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Contato
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Imóveis
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Serviços
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.items.map((client) => (
            <tr key={client.id} className="hover:bg-zinc-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                <Link
                  href={`/clients/${client.id}`}
                  className="hover:underline"
                >
                  {client.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    client.kind === "COMPANY"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {client.kind === "COMPANY" ? "PJ" : "PF"}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {client.document ? (
                  <span className="font-mono text-xs">{client.document}</span>
                ) : (
                  <span className="text-xs text-zinc-300">&mdash;</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {client.email && <div>{client.email}</div>}
                {client.phone && (
                  <div className="text-xs text-zinc-400">{client.phone}</div>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-600">
                {client._count.properties}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-600">
                {client._count.services}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/clients/${client.id}`}
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
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-zinc-400">Nenhum cliente encontrado.</p>
          {data.search && (
            <p className="mt-1 text-xs text-zinc-400">
              Tente ajustar a busca ou limpar o filtro.
            </p>
          )}
          {!data.search && (
            <p className="mt-1 text-xs text-zinc-400">
              Crie um novo cliente usando o formulário ao lado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
