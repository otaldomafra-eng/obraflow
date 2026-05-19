import { notFound } from "next/navigation";

import { ProposalDetail } from "@/features/proposals/ProposalDetail";
import { getProposal } from "@/features/proposals/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { proposalId } = await params;

  const proposal = await getProposal(tenantId, proposalId);

  if (!proposal) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProposalDetail proposal={proposal} />
    </div>
  );
}
