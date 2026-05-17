import Link from "next/link";
import { notFound } from "next/navigation";

import { getPropertyDetail } from "@/features/properties/actions";
import { requireTenantId } from "@/server/auth/tenant";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { propertyId } = await params;
  const property = await getPropertyDetail(tenantId, propertyId);

  if (!property) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/properties" className="hover:text-zinc-700">
            Imóveis
          </Link>
          <span>/</span>
          <span className="text-zinc-900">{property.name}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{property.name}</h1>
          <Link
            href={`/properties/${property.id}/edit`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Editar
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Informações</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Cliente</dt>
              <dd className="text-zinc-900">
                <Link
                  href={`/clients/${property.client.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {property.client.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Endereço</dt>
              <dd className="text-zinc-900">
                {property.address || <span className="text-zinc-300">&mdash;</span>}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Cidade</dt>
              <dd className="text-zinc-900">
                {property.city ? (
                  <span>
                    {property.city}
                    {property.state && `/${property.state}`}
                  </span>
                ) : (
                  <span className="text-zinc-300">&mdash;</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">CEP</dt>
              <dd className="text-zinc-900">
                {property.postalCode || (
                  <span className="text-zinc-300">&mdash;</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Contato do Cliente</h2>
          {(property.client.email || property.client.phone) ? (
            <dl className="space-y-3 text-sm">
              {property.client.email && (
                <div>
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="text-zinc-900">{property.client.email}</dd>
                </div>
              )}
              {property.client.phone && (
                <div>
                  <dt className="text-zinc-500">Telefone</dt>
                  <dd className="text-zinc-900">{property.client.phone}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-zinc-400">Nenhum contato registrado.</p>
          )}
        </div>
      </div>

      {property.notes && (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-semibold">Observações</h2>
          </div>
          <div className="p-6">
            <p className="whitespace-pre-wrap text-sm text-zinc-700">
              {property.notes}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Serviços Vinculados</h2>
            <Link
              href={`/services/new?clientId=${property.client.id}&propertyId=${property.id}`}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              Novo
            </Link>
          </div>
        </div>
        <div className="p-6">
          {property.services.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Nenhum serviço vinculado a este imóvel.
            </p>
          ) : (
            <ul className="space-y-2">
              {property.services.map((service) => (
                <li key={service.id} className="text-sm">
                  <Link
                    href={`/services/${service.id}`}
                    className="font-medium text-zinc-900 hover:text-blue-600 transition-colors"
                  >
                    {service.title}
                  </Link>
                  <span className="ml-2">
                    <StatusBadge status={service.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
