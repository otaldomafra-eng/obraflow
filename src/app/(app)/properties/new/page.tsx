import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createProperty } from "@/features/properties/actions";
import { PropertyNewForm } from "@/features/properties/PropertyNewForm";
import { listClientsForSelect } from "@/features/clients/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage(props: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await props.searchParams;
  const tenantId = await requireTenantId();
  const clients = await listClientsForSelect(tenantId);

  async function handleCreate(formData: FormData) {
    "use server";

    const property = await createProperty(tenantId, {
      clientId: formData.get("clientId") as string,
      name: formData.get("name") as string,
      address: (formData.get("address") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
    });

    revalidatePath("/properties");
    redirect(`/properties/${property.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/properties" className="hover:text-zinc-700">
            Imóveis
          </Link>
          <span>/</span>
          <span className="text-zinc-900">Novo</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Novo Imóvel</h1>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <PropertyNewForm
          action={handleCreate}
          clients={clients}
          initialClientId={clientId}
        />
      </div>
    </div>
  );
}
