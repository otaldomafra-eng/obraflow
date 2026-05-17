import Link from "next/link";

import { ClientList } from "@/features/clients/ClientList";
import { listClients } from "@/features/clients/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function ClientsPage(props: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await props.searchParams;
  const tenantId = await requireTenantId();
  const data = await listClients(tenantId, { search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Clientes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie pessoas físicas e jurídicas.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Cliente
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <form className="flex-1">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Buscar clientes por nome, email ou CPF/CNPJ..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </form>
        {search && (
          <Link
            href="/clients"
            className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition-all duration-150 hover:bg-zinc-50"
          >
            Limpar
          </Link>
        )}
      </div>

      <ClientList data={data} />
    </div>
  );
}
