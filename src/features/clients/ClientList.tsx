import Link from "next/link";

import type { listClients } from "@/features/clients/actions";

interface ClientListProps {
  data: Awaited<ReturnType<typeof listClients>>;
}

export function ClientList({ data }: ClientListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      {data.items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Documento
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Contato
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Imóveis
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Serviços
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {data.items.map((client) => (
                <tr key={client.id} className="transition-colors hover:bg-zinc-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                    <Link
                      href={`/clients/${client.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        client.kind === "COMPANY"
                          ? "bg-blue-50 text-blue-700 ring-blue-200"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      }`}
                    >
                      {client.kind === "COMPANY" ? "PJ" : "PF"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {client.document ? (
                      <span className="font-mono text-xs text-zinc-600">{client.document}</span>
                    ) : (
                      <span className="text-xs text-zinc-300">&mdash;</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {client.email && <div>{client.email}</div>}
                    {client.phone && (
                      <div className="text-xs text-zinc-400">{client.phone}</div>
                    )}
                    {!client.email && !client.phone && (
                      <span className="text-xs text-zinc-300">&mdash;</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-zinc-600">
                    {client._count.properties}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-zinc-600">
                    {client._count.services}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-sm font-medium text-zinc-500 transition-colors hover:text-blue-600"
                    >
                      Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.items.length === 0 && (
        <div className="px-6 py-16 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
              <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-zinc-500">Nenhum cliente encontrado.</p>
          {data.search && (
            <p className="mt-1 text-xs text-zinc-400">
              Tente ajustar a busca ou limpar o filtro.
            </p>
          )}
          {!data.search && (
            <p className="mt-1 text-xs text-zinc-400">
              Crie um novo cliente usando o botão &ldquo;Novo Cliente&rdquo;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
