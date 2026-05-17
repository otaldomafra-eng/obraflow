import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getClientEdit, updateClient } from "@/features/clients/actions";
import type { UpdateClientInput } from "@/features/clients/actions";
import { ClientEditForm } from "@/features/clients/ClientEditForm";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function ClientEditPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { clientId } = await params;
  const client = await getClientEdit(tenantId, clientId);

  if (!client) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";

    const kind = (formData.get("kind") as "PERSON" | "COMPANY") || "PERSON";

    const input: UpdateClientInput = {
      name: formData.get("name") as string,
      kind,
      document: (formData.get("document") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    await updateClient(tenantId, clientId, input);

    revalidatePath(`/clients/${clientId}`);
    return { redirectUrl: `/clients/${clientId}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/clients" className="hover:text-zinc-700">
            Clientes
          </Link>
          <span>/</span>
          <Link href={`/clients/${clientId}`} className="hover:text-zinc-700">
            {client.name}
          </Link>
          <span>/</span>
          <span className="text-zinc-900">Editar</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">Editar Cliente</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <ClientEditForm
          action={handleUpdate}
          clientId={clientId}
          defaultValues={{
            name: client.name,
            kind: client.kind,
            document: client.document ?? "",
            email: client.email ?? "",
            phone: client.phone ?? "",
            notes: client.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
