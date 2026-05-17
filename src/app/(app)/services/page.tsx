import Link from "next/link";

import { ServiceList } from "@/features/services/ServiceList";
import { listServices } from "@/features/services/actions";
import { requireTenantId } from "@/server/auth/tenant";

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "NEW", label: "Novo" },
  { value: "PROPOSAL", label: "Proposta" },
  { value: "AWAITING_ACCEPTANCE", label: "Aguardando Aceite" },
  { value: "CONTRACTED", label: "Contratado" },
  { value: "PLANNING", label: "Planejamento" },
  { value: "PRODUCTION", label: "Produção" },
  { value: "APPROVAL", label: "Aprovação" },
  { value: "WORK", label: "Em Obra" },
  { value: "AWAITING_CLIENT", label: "Aguardando Cliente" },
  { value: "PAUSED", label: "Pausado" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELED", label: "Cancelado" },
];

export default async function ServicesPage(props: {
  searchParams: Promise<{ search?: string; clientId?: string; propertyId?: string; status?: string }>;
}) {
   const { search, clientId, propertyId, status } = await props.searchParams;
   const tenantId = await requireTenantId();
   const servicesData = await listServices(tenantId, {
     search,
     clientId,
     propertyId,
     status: (status || undefined) as import("@/features/services/actions").ListServicesInput["status"],
   });

   const hasFilter = !!(search || clientId || propertyId || status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gerencie os serviços dos seus clientes.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <form className="flex-1 space-y-2">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Buscar serviços por título ou descrição..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={status ?? ""}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {clientId && (
            <input type="hidden" name="clientId" value={clientId} />
          )}
          {propertyId && (
            <input type="hidden" name="propertyId" value={propertyId} />
          )}
        </form>
        {hasFilter && (
          <Link
            href="/services"
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Limpar
          </Link>
        )}
        <Link
          href="/services/new"
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Novo Serviço
        </Link>
      </div>

      <ServiceList data={servicesData} />
    </div>
  );
}