import { listProperties } from "@/features/properties/actions";
import { requireTenantId } from "@/server/auth/tenant";
import Link from "next/link";

export default async function PropertiesPage(props: {
  searchParams: Promise<{ search?: string; clientId?: string }>;
}) {
  const { search, clientId } = await props.searchParams;
  const tenantId = await requireTenantId();
  const data = await listProperties(tenantId, { search, clientId });

  const hasFilter = !!(search || clientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Imóveis</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Imóveis e empreendimentos vinculados aos clientes.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <form className="flex-1">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Buscar imóveis por nome, endereço ou cidade..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
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
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Endereço
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Serviços
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.items.map((property) => (
              <tr key={property.id} className="hover:bg-zinc-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                  <Link
                    href={`/properties/${property.id}`}
                    className="hover:underline"
                  >
                    {property.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                  <Link
                    href={`/clients/${property.client.id}`}
                    className="hover:underline"
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
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-600">
                  {property._count.services}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.items.length === 0 && (
          <div className="px-4 py-12 text-center">
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
