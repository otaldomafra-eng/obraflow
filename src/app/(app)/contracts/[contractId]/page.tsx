import { notFound } from "next/navigation";

import { ContractDetail } from "@/features/contracts/ContractDetail";
import { getContract } from "@/features/contracts/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { contractId } = await params;

  const contract = await getContract(tenantId, contractId);

  if (!contract) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ContractDetail contract={contract} />
    </div>
  );
}
