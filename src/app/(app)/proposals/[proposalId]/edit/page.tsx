import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ProposalForm } from "@/features/proposals/ProposalForm";
import { getProposal, updateProposal } from "@/features/proposals/actions";
import { listServiceOptions } from "@/features/services/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { proposalId } = await params;

  const [proposal, services] = await Promise.all([
    getProposal(tenantId, proposalId),
    listServiceOptions(tenantId),
  ]);

  if (!proposal) {
    notFound();
  }

  const proposalServiceId = proposal.serviceId;

  async function handleUpdate(formData: FormData) {
    "use server";

    await updateProposal(tenantId, proposalServiceId, proposalId, {
      title: (formData.get("title") as string) || undefined,
      totalAmount: (formData.get("totalAmount") as string) || undefined,
      status: (formData.get("status") as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "CANCELED") || undefined,
      validUntil: (formData.get("validUntil") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    revalidatePath(`/proposals/${proposalId}`);
    revalidatePath("/proposals");
    return { redirectUrl: `/proposals/${proposalId}` };
  }

  const validUntilStr = proposal.validUntil
    ? new Date(proposal.validUntil).toISOString().split("T")[0]
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Editar Proposta
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atualize os dados da proposta.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <Suspense fallback={<div className="text-sm text-zinc-400">Carregando...</div>}>
          <ProposalForm
            action={handleUpdate}
            services={services}
            proposal={{
              serviceId: proposal.serviceId,
              title: proposal.title,
              totalAmount: proposal.totalAmount
                ? proposal.totalAmount.toString()
                : null,
              status: proposal.status,
              validUntil: validUntilStr,
              notes: proposal.notes,
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
