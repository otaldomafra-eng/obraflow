import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { ServiceTaskForm } from "@/features/service-tasks/ServiceTaskForm";
import { getServiceTask, updateServiceTask } from "@/features/service-tasks/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function ServiceTaskEditPage({
  params,
}: {
  params: Promise<{ serviceId: string; taskId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { serviceId, taskId } = await params;

  const task = await getServiceTask(tenantId, taskId);

  if (!task) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";

    await updateServiceTask(tenantId, taskId, {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      status: (formData.get("status") as "PLANNING" | "PRODUCTION" | "DELIVERED" | "CANCELED") || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
    });

    revalidatePath(`/services/${serviceId}/tasks/${taskId}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Tarefa</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atualize os dados da tarefa.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <ServiceTaskForm
          action={handleUpdate}
          serviceId={serviceId}
          task={{
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate
              ? new Date(task.dueDate).toISOString().split("T")[0]
              : null,
          }}
        />
      </div>
    </div>
  );
}