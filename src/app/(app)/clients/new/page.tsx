import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClientForm } from "@/features/clients/ClientForm";
import { createClient } from "@/features/clients/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  const tenantId = await requireTenantId();

  async function handleCreate(formData: FormData) {
    "use server";

    const kind = (formData.get("kind") as "PERSON" | "COMPANY") || "PERSON";

    const client = await createClient(tenantId, {
      name: formData.get("name") as string,
      kind,
      document: (formData.get("document") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
    });

    revalidatePath("/clients");
    redirect(`/clients/${client.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/clients" className="hover:text-zinc-700">
            Clientes
          </Link>
          <span>/</span>
          <span className="text-zinc-900">Novo</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Novo Cliente</h1>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <ClientForm action={handleCreate} />
      </div>
    </div>
  );
}
