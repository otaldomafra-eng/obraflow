import { listProperties } from "@/features/properties/actions";
import { requireTenantId } from "@/server/auth/tenant";
import Link from "next/link";

export default async function PropertiesPage(props: {
  searchParams: Promise<{ search?: string; clientId?: string; city?: string; state?: string }>;
}) {
  const { search, clientId, city, state } = await props.searchParams;
  const tenantId = await requireTenantId();
  const data = await listProperties(tenantId, { search, clientId, city, state });

  const hasFilter = !!(search || clientId || city || state);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Imóveis</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Imóveis e empreendimentos vinculados aos clientes.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <form className="flex-1 space-y-2">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Buscar imóveis por nome, endereço ou cidade..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <div className="flex gap-2">
            <input
              name="city"
              defaultValue={city ?? ""}
              placeholder="Cidade"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <input
              name="state"
              defaultValue={state ?? ""}
              placeholder="Estado"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          {clientId && (
            <input type="hidden" name="clientId" value={clientId} />
          )}
        </form>
        {hasFilter && (
          <Link
            href="/properties"
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Limpar
          </Link>
        )}
        <Link
          href="/properties/new"
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Novo Imóvel
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Endereço
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Serviços
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.items.map((property) => (
              <tr key={property.id} className="hover:bg-zinc-50 transition-colors">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                  <Link
                    href={`/properties/${property.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {property.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                  <Link
                    href={`/clients/${property.client.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {property.client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {property.address && <div>{property.address}</div>}
                  {property.city && (
                    <div className="text-xs text-zinc-400">
                      {property.city}
                      {property.state && `/${property.state}`}
                    </div>
                  )}
                  {!property.address && !property.city && (
                    <span className="text-xs text-zinc-300">&mdash;</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-zinc-600">
                  {property._count.services}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.items.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <svg className="mb-3 h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
            </svg>
            <p className="text-sm text-zinc-400">Nenhum imóvel encontrado.</p>
            {!hasFilter && (
              <p className="mt-1 text-xs text-zinc-400">
                Crie um cliente e vincule um imóvel na página de{" "}
                <Link href="/clients" className="underline hover:text-zinc-600">
                  clientes
                </Link>
                .
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
