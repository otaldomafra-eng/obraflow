import Link from "next/link";

import { requireTenantId } from "@/server/auth/tenant";
import { listDocuments } from "@/features/documents/actions";
import { DocumentList } from "@/features/documents/DocumentList";

export const dynamic = "force-dynamic";

const visibilityLabels: Record<string, string> = {
  INTERNAL: "Interno",
  CLIENT_VISIBLE: "Visível ao Cliente",
  SUPPLIER_VISIBLE: "Visível ao Fornecedor",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; visibility?: string; serviceId?: string }>;
}) {
  const tenantId = await requireTenantId();
  const params = await searchParams;

  const documents = await listDocuments(tenantId, {
    search: params.search,
    visibility: params.visibility,
    serviceId: params.serviceId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Documentos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie os arquivos vinculados a serviços e propostas.
          </p>
        </div>
        <Link
          href="/documents/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          + Novo Documento
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <form className="flex items-center gap-4">
            <input
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Buscar por título..."
              className="block w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <select
              name="visibility"
              defaultValue={params.visibility ?? ""}
              className="block rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            >
              <option value="">Todas as visibilidades</option>
              {Object.entries(visibilityLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Filtrar
            </button>
          </form>
        </div>
        <div className="p-6">
          <DocumentList documents={documents} />
        </div>
      </div>
    </div>
  );
}
