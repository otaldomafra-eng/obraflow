import { revalidatePath } from "next/cache";
import { Suspense } from "react";

import { ProposalForm } from "@/features/proposals/ProposalForm";
import { createProposal } from "@/features/proposals/actions";
import { listServiceOptions } from "@/features/services/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function NewProposalPage() {
  const tenantId = await requireTenantId();
  const services = await listServiceOptions(tenantId);

  async function handleCreate(formData: FormData) {
    "use server";

    const proposal = await createProposal(tenantId, {
      serviceId: formData.get("serviceId") as string,
      title: formData.get("title") as string,
      totalAmount: (formData.get("totalAmount") as string) || undefined,
      status: (formData.get("status") as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "CANCELED") || undefined,
      validUntil: (formData.get("validUntil") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    revalidatePath("/proposals");
    revalidatePath(`/services/${formData.get("serviceId")}`);
    return { redirectUrl: `/proposals/${proposal.id}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Nova Proposta
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Crie uma proposta comercial vinculada a um serviço.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <Suspense fallback={<div className="text-sm text-zinc-400">Carregando...</div>}>
          <ProposalForm action={handleCreate} services={services} />
        </Suspense>
      </div>
    </div>
  );
}
