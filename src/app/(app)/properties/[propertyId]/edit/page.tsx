import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPropertyDetail, updateProperty } from "@/features/properties/actions";
import { PropertyEditForm } from "@/features/properties/PropertyEditForm";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function PropertyEditPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { propertyId } = await params;
  const property = await getPropertyDetail(tenantId, propertyId);

  if (!property) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";

    await updateProperty(tenantId, propertyId, {
      name: formData.get("name") as string,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      postalCode: (formData.get("postalCode") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });

    revalidatePath(`/properties/${propertyId}`);
    return { redirectUrl: `/properties/${propertyId}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/properties" className="hover:text-zinc-700">
            Imóveis
          </Link>
          <span>/</span>
          <Link
            href={`/properties/${propertyId}`}
            className="hover:text-zinc-700"
          >
            {property.name}
          </Link>
          <span>/</span>
          <span className="text-zinc-900">Editar</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
          Editar Imóvel
        </h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <PropertyEditForm
          action={handleUpdate}
          propertyId={propertyId}
          defaultValues={{
            name: property.name,
            address: property.address ?? "",
            city: property.city ?? "",
            state: property.state ?? "",
            postalCode: property.postalCode ?? "",
            notes: property.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
