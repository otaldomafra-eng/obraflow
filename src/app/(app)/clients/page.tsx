import { revalidatePath } from "next/cache";

import { ClientForm } from "@/features/clients/ClientForm";
import { ClientList } from "@/features/clients/ClientList";
import { createClient, listClients } from "@/features/clients/actions";
import { requireTenantId } from "@/server/auth/tenant";

export default async function ClientsPage() {
  const tenantId = await requireTenantId();
  const data = await listClients(tenantId);

  async function handleCreate(formData: FormData) {
    "use server";

    const kind = (formData.get("kind") as "PERSON" | "COMPANY") || "PERSON";

    await createClient(tenantId, {
      name: formData.get("name") as string,
      kind,
      document: (formData.get("document") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
    });

    revalidatePath("/clients");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gerencie pessoas físicas e jurídicas.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ClientList data={data} />
        </div>
        <div>
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-base font-semibold">Novo Cliente</h2>
            <ClientForm action={handleCreate} />
          </div>
        </div>
      </div>
    </div>
  );
}
