import { listProperties } from "@/features/properties/actions";
import { requireTenantId } from "@/server/auth/tenant";
import Link from "next/link";

export default async function PropertiesPage() {
  const tenantId = await requireTenantId();
  const data = await listProperties(tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Imóveis</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Imóveis e empreendimentos vinculados aos clientes.
        </p>
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
                Cidade
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
                  {property.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                  <Link
                    href={`/clients/${property.client.id}`}
                    className="hover:underline"
                  >
                    {property.client.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                  {property.city && (
                    <span>
                      {property.city}
                      {property.state && `/${property.state}`}
                    </span>
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
          <div className="px-4 py-12 text-center text-sm text-zinc-400">
            Nenhum imóvel encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
