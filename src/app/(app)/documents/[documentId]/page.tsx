import { notFound } from "next/navigation";

import { requireTenantId } from "@/server/auth/tenant";
import { getDocument } from "@/features/documents/actions";
import { DocumentDetail } from "@/features/documents/DocumentDetail";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { documentId } = await params;

  const document = await getDocument(tenantId, documentId);

  if (!document) notFound();

  return (
    <div className="space-y-6">
      <DocumentDetail document={document} />
    </div>
  );
}
