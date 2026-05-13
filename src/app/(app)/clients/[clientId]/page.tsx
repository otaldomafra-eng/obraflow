import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getClientDetail } from "@/features/clients/actions";
import { PropertyForm } from "@/features/properties/PropertyForm";
import { createProperty } from "@/features/properties/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { clientId } = await params;
  const client = await getClientDetail(tenantId, clientId);

  if (!client) notFound();

  async function handleAddProperty(formData: FormData) {
    "use server";

    await createProperty(tenantId, {
      clientId,
      name: formData.get("name") as string,
      address: (formData.get("address") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
    });

    revalidatePath(`/clients/${clientId}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/clients" className="hover:text-zinc-700">
            Clientes
          </Link>
          <span>/</span>
          <span className="text-zinc-900">{client.name}</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{client.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {client.kind === "COMPANY" ? "Pessoa Jurídica" : "Pessoa Física"}
          {client.document && ` · ${client.document}`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Contato</h2>
          <dl className="space-y-3 text-sm">
            {client.email && (
              <div className="flex justify-between">
                <dt className="text-zinc-500">Email</dt>
                <dd className="text-zinc-900">{client.email}</dd>
              </div>
            )}
            {client.phone && (
              <div className="flex justify-between">
                <dt className="text-zinc-500">Telefone</dt>
                <dd className="text-zinc-900">{client.phone}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Imóveis</h2>
          {client.properties.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum imóvel vinculado.</p>
          ) : (
            <ul className="space-y-2">
              {client.properties.map((property) => (
                <li key={property.id} className="text-sm">
                  <span className="font-medium text-zinc-900">{property.name}</span>
                  {property.city && (
                    <span className="text-zinc-500">
                      {" "}
                      · {property.city}/{property.state}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-zinc-400">
                    {property._count.services} serviço(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">Vincular Imóvel</h2>
        <PropertyForm action={handleAddProperty} clientLabel={client.name} />
      </div>

      {client.services.length > 0 && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Serviços</h2>
          <ul className="space-y-2">
            {client.services.map((service) => (
              <li key={service.id} className="text-sm">
                <Link
                  href={`/services/${service.id}`}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  {service.title}
                </Link>
                <span className="ml-2 text-xs text-zinc-400">{service.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
