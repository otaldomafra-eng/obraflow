import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { requireTenantId } from "@/server/auth/tenant";
import { getDocument, updateDocument } from "@/features/documents/actions";
import { listServiceOptions } from "@/features/services/actions";
import { DocumentForm } from "@/features/documents/DocumentForm";

export const dynamic = "force-dynamic";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { documentId } = await params;

  const [document, services] = await Promise.all([
    getDocument(tenantId, documentId),
    listServiceOptions(tenantId),
  ]);

  if (!document) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";

    await updateDocument(tenantId, documentId, {
      title: (formData.get("title") as string) || undefined,
      url: (formData.get("url") as string) || undefined,
      visibility: (formData.get("visibility") as "INTERNAL" | "CLIENT_VISIBLE" | "SUPPLIER_VISIBLE") || undefined,
      mimeType: (formData.get("mimeType") as string) || undefined,
    });

    revalidatePath(`/documents/${documentId}`);
    revalidatePath("/documents");
    return { redirectUrl: `/documents/${documentId}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Editar Documento</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atualize as informações do documento.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <Suspense fallback={<div className="text-sm text-zinc-400">Carregando...</div>}>
          <DocumentForm
            action={handleUpdate}
            services={services}
            document={{
              serviceId: document.serviceId,
              proposalId: document.proposalId,
              title: document.title,
              url: document.url,
              visibility: document.visibility,
              mimeType: document.mimeType,
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
