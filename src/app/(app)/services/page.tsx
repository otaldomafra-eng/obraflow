import { revalidatePath } from "next/cache";

import { ServiceForm } from "@/features/services/ServiceForm";
import { ServiceList } from "@/features/services/ServiceList";
import { createService, listServices } from "@/features/services/actions";
import { listClients } from "@/features/clients/actions";
import { listProperties } from "@/features/properties/actions";
import { requireTenantId } from "@/server/auth/tenant";

export default async function ServicesPage() {
   const tenantId = await requireTenantId();
   const [servicesData, clientsData, propertiesData] = await Promise.all([
     listServices(tenantId),
     listClients(tenantId, { pageSize: 100 }),
     listProperties(tenantId, { pageSize: 100 }),
   ]);

   const propertiesByClient: Record<string, { id: string; name: string }[]> = {};
   for (const p of propertiesData.items) {
     if (!propertiesByClient[p.client.id]) {
       propertiesByClient[p.client.id] = [];
     }
     propertiesByClient[p.client.id].push({ id: p.id, name: p.name });
   }

   async function handleCreate(formData: FormData) {
    "use server";

    const clientId = formData.get("clientId") as string;
    const propertyId = formData.get("propertyId") as string;

    await createService(tenantId, {
      clientId,
      propertyId: propertyId || undefined,
      title: formData.get("title") as string,
      type: formData.get("type") as "TECHNICAL_PROJECT" | "REGULARIZATION" | "WORK_EXECUTION" | "CONSULTING" | "FIRE_SAFETY" | "PROJECT_APPROVAL_WORK",
      description: (formData.get("description") as string) || undefined,
      startDate: (formData.get("startDate") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
    });

    revalidatePath("/services");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gerencie os serviços dos seus clientes.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ServiceList data={servicesData} />
        </div>
        <div>
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-base font-semibold">Novo Serviço</h2>
<ServiceForm
               action={handleCreate}
               clients={clientsData.items}
               propertiesByClient={propertiesByClient}
             />
          </div>
        </div>
      </div>
    </div>
  );
}