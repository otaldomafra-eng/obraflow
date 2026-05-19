import { revalidatePath } from "next/cache";
import { Suspense } from "react";

import { requireTenantId } from "@/server/auth/tenant";
import { createDocument } from "@/features/documents/actions";
import { listServiceOptions } from "@/features/services/actions";
import { DocumentForm } from "@/features/documents/DocumentForm";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage() {
  const tenantId = await requireTenantId();
  const services = await listServiceOptions(tenantId);

  async function handleCreate(formData: FormData) {
    "use server";

    const proposalId = (formData.get("proposalId") as string) || undefined;

    const document = await createDocument(tenantId, {
      serviceId: formData.get("serviceId") as string,
      proposalId,
      title: formData.get("title") as string,
      url: formData.get("url") as string,
      visibility: (formData.get("visibility") as "INTERNAL" | "CLIENT_VISIBLE" | "SUPPLIER_VISIBLE") || undefined,
      mimeType: (formData.get("mimeType") as string) || undefined,
    });

    revalidatePath("/documents");
    revalidatePath(`/services/${document.serviceId}`);
    if (proposalId) revalidatePath(`/proposals/${proposalId}`);
    return { redirectUrl: `/documents/${document.id}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Novo Documento</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Adicione um arquivo vinculado a um serviço ou proposta.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <Suspense fallback={<div className="text-sm text-zinc-400">Carregando...</div>}>
          <DocumentForm action={handleCreate} services={services} />
        </Suspense>
      </div>
    </div>
  );
}
