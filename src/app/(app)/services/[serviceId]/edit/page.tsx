import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getServiceDetail, updateService } from "@/features/services/actions";
import type { UpdateServiceInput } from "@/features/services/actions";
import { ServiceEditForm } from "@/features/services/ServiceEditForm";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function ServiceEditPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { serviceId } = await params;
  const service = await getServiceDetail(tenantId, serviceId);

  if (!service) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";

    await updateService(tenantId, serviceId, {
      title: formData.get("title") as string,
      status: (formData.get("status") as UpdateServiceInput["status"]) ?? undefined,
      description: (formData.get("description") as string) || null,
      startDate: (formData.get("startDate") as string) || null,
      dueDate: (formData.get("dueDate") as string) || null,
    });

    revalidatePath(`/services/${serviceId}`);
    redirect(`/services/${serviceId}`);
  }

  const formatDate = (d: Date | null | undefined) => {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/services" className="hover:text-zinc-700">
            Serviços
          </Link>
          <span>/</span>
          <Link
            href={`/services/${serviceId}`}
            className="hover:text-zinc-700"
          >
            {service.title}
          </Link>
          <span>/</span>
          <span className="text-zinc-900">Editar</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Editar Serviço
        </h1>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <ServiceEditForm
          action={handleUpdate}
          serviceId={serviceId}
          defaultValues={{
            title: service.title,
            status: service.status,
            description: service.description ?? "",
            startDate: formatDate(service.startDate),
            dueDate: formatDate(service.dueDate),
          }}
        />
      </div>
    </div>
  );
}
