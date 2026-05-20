import { revalidatePath } from "next/cache";

import { ContractForm } from "@/features/contracts/ContractForm";
import { createContract } from "@/features/contracts/actions";
import type { ContractStatus } from "@/features/contracts/actions";
import { listServiceOptions } from "@/features/services/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  const tenantId = await requireTenantId();
  const services = await listServiceOptions(tenantId);

  async function handleCreate(formData: FormData) {
    "use server";

    const proposalId = (formData.get("proposalId") as string) || undefined;
    const contract = await createContract(tenantId, {
      serviceId: formData.get("serviceId") as string,
      status: (formData.get("status") as ContractStatus) || undefined,
      proposalId: proposalId || undefined,
    });

    revalidatePath("/contracts");
    revalidatePath(`/services/${formData.get("serviceId")}`);
    if (proposalId) revalidatePath(`/proposals/${proposalId}`);
    return { redirectUrl: `/contracts/${contract.id}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Novo Contrato
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Crie um contrato vinculado a um serviço.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <ContractForm action={handleCreate} services={services} />
      </div>
    </div>
  );
}
