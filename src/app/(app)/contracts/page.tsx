import Link from "next/link";

import { ContractList } from "@/features/contracts/ContractList";
import { listContracts } from "@/features/contracts/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "ISSUED", label: "Emitido" },
  { value: "SIGNED", label: "Assinado" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; serviceId?: string }>;
}) {
  const tenantId = await requireTenantId();
  const params = await searchParams;

  const contracts = await listContracts(tenantId, {
    status: params.status || undefined,
    search: params.search || undefined,
    serviceId: params.serviceId || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Contratos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie contratos vinculados a serviços.
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800"
        >
          Novo Contrato
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => {
          const href = value ? `/contracts?status=${value}` : "/contracts";
          const isActive = value ? params.status === value : !params.status;
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <ContractList contracts={contracts} />
    </div>
  );
}
