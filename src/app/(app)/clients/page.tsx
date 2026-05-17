import { revalidatePath } from "next/cache";
import Link from "next/link";

import { ClientForm } from "@/features/clients/ClientForm";
import { ClientList } from "@/features/clients/ClientList";
import { createClient, listClients } from "@/features/clients/actions";
import { requireTenantId } from "@/server/auth/tenant";

export default async function ClientsPage(props: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await props.searchParams;
  const tenantId = await requireTenantId();
  const data = await listClients(tenantId, { search });

  async function handleCreate(formData: FormData) {
    "use server";

    const kind = (formData.get("kind") as "PERSON" | "COMPANY") || "PERSON";

    await createClient(tenantId, {
      name: formData.get("name") as string,
      kind,
      document: (formData.get("document") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
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

      <div className="flex items-center gap-2">
        <form className="flex-1">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Buscar clientes por nome, email ou CPF/CNPJ..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </form>
        {search && (
          <Link
            href="/clients"
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Limpar
          </Link>
        )}
        <Link
          href="/clients/new"
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Novo Cliente
        </Link>
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
