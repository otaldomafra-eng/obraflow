import { revalidatePath } from "next/cache";
import Link from "next/link";

import { ServiceForm } from "@/features/services/ServiceForm";
import { createService } from "@/features/services/actions";
import { listClientsForSelect } from "@/features/clients/actions";
import { listProperties } from "@/features/properties/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function NewServicePage(props: {
  searchParams: Promise<{ clientId?: string; propertyId?: string }>;
}) {
  const { clientId, propertyId } = await props.searchParams;
  const tenantId = await requireTenantId();

  const [clients, propertiesData] = await Promise.all([
    listClientsForSelect(tenantId),
    listProperties(tenantId, { pageSize: 100 }),
  ]);

  const propertiesByClient: Record<string, { id: string; name: string }[]> = {};
  for (const p of propertiesData.items) {
    if (!propertiesByClient[p.client.id]) {
      propertiesByClient[p.client.id] = [];
    }
    propertiesByClient[p.client.id].push({ id: p.id, name: p.name });
  }

  const propertyClientId = propertyId
    ? propertiesData.items.find((property) => property.id === propertyId)?.client.id
    : undefined;
  const initialClientId = clientId ?? propertyClientId;

  async function handleCreate(formData: FormData) {
    "use server";

    const service = await createService(tenantId, {
      clientId: formData.get("clientId") as string,
      propertyId: (formData.get("propertyId") as string) || undefined,
      title: formData.get("title") as string,
      type: formData.get("type") as "TECHNICAL_PROJECT" | "REGULARIZATION" | "WORK_EXECUTION" | "CONSULTING" | "FIRE_SAFETY" | "PROJECT_APPROVAL_WORK",
      description: (formData.get("description") as string) || undefined,
      startDate: (formData.get("startDate") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
      artNumber: (formData.get("artNumber") as string) || undefined,
      technicalLead: (formData.get("technicalLead") as string) || undefined,
      councilRegNumber: (formData.get("councilRegNumber") as string) || undefined,
      internalCode: (formData.get("internalCode") as string) || undefined,
    });

    revalidatePath("/services");
    return { redirectUrl: `/services/${service.id}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/services" className="hover:text-zinc-700">
            Serviços
          </Link>
          <span>/</span>
          <span className="text-zinc-900">Novo</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">Novo Serviço</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <ServiceForm
          action={handleCreate}
          clients={clients}
          propertiesByClient={propertiesByClient}
          initialClientId={initialClientId}
          initialPropertyId={propertyId}
        />
      </div>
    </div>
  );
}
