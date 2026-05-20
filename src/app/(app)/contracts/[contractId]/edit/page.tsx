import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { ContractForm } from "@/features/contracts/ContractForm";
import { getContract, updateContract } from "@/features/contracts/actions";
import type { ContractStatus } from "@/features/contracts/actions";
import { listServiceOptions } from "@/features/services/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { contractId } = await params;

  const [contract, services] = await Promise.all([
    getContract(tenantId, contractId),
    listServiceOptions(tenantId),
  ]);

  if (!contract) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";

    await updateContract(tenantId, contractId, {
      status: (formData.get("status") as ContractStatus) || undefined,
    });

    revalidatePath(`/contracts/${contractId}`);
    revalidatePath("/contracts");
    return { redirectUrl: `/contracts/${contractId}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Editar Contrato {contract.number}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atualize os dados do contrato.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <ContractForm
          action={handleUpdate}
          services={services}
          contract={{
            serviceId: contract.serviceId,
            status: contract.status,
            number: contract.number,
          }}
        />
      </div>
    </div>
  );
}
