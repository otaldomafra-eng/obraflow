import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getServiceDetail } from "@/features/services/actions";
import { createServiceTask } from "@/features/service-tasks/actions";
import { ServiceTaskForm } from "@/features/service-tasks/ServiceTaskForm";
import { ServiceTaskList } from "@/features/service-tasks/ServiceTaskList";
import { listServiceTasks } from "@/features/service-tasks/actions";
import { requireTenantId } from "@/server/auth/tenant";

const statusLabels: Record<string, string> = {
  NEW: "Novo",
  PROPOSAL: "Proposta",
  AWAITING_ACCEPTANCE: "Aguardando Aceite",
  CONTRACTED: "Contratado",
  PLANNING: "Planejamento",
  PRODUCTION: "Produção",
  APPROVAL: "Aprovação",
  WORK: "Em Obra",
  AWAITING_CLIENT: "Aguardando Cliente",
  PAUSED: "Pausado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

const typeLabels: Record<string, string> = {
  TECHNICAL_PROJECT: "Projeto Técnico",
  REGULARIZATION: "Regularização",
  WORK_EXECUTION: "Execução de Obra",
  CONSULTING: "Consultoria",
  FIRE_SAFETY: "Prevenção de Incêndio",
  PROJECT_APPROVAL_WORK: "Aprovação de Projeto",
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { serviceId } = await params;

  const service = await getServiceDetail(tenantId, serviceId);

  if (!service) {
    notFound();
  }

  const tasks = await listServiceTasks(tenantId, serviceId);

  async function handleCreateTask(formData: FormData) {
    "use server";

await createServiceTask(tenantId, {
       serviceId,
       title: formData.get("title") as string,
       description: (formData.get("description") as string) || undefined,
       status: (formData.get("status") as "PLANNING" | "PRODUCTION" | "DELIVERED" | "CANCELED") || undefined,
       dueDate: (formData.get("dueDate") as string) || undefined,
     });

    revalidatePath(`/services/${serviceId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{service.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {typeLabels[service.type] || service.type}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          {statusLabels[service.status] || service.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Informações</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-zinc-500">Cliente</dt>
              <dd className="text-sm text-zinc-900">
                <Link
                  href={`/clients/${service.client.id}`}
                  className="hover:underline"
                >
                  {service.client.name}
                </Link>
              </dd>
            </div>
            {service.property && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">Imóvel</dt>
                <dd className="text-sm text-zinc-900">
                  {service.property.name}
                  {service.property.address && (
                    <span className="text-zinc-400"> - {service.property.address}</span>
                  )}
                </dd>
              </div>
            )}
            {service.description && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">Descrição</dt>
                <dd className="text-sm text-zinc-900">{service.description}</dd>
              </div>
            )}
            {service.startDate && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">Data de Início</dt>
                <dd className="text-sm text-zinc-900">
                  {new Date(service.startDate).toLocaleDateString("pt-BR")}
                </dd>
              </div>
            )}
            {service.dueDate && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">Data de Entrega</dt>
                <dd className="text-sm text-zinc-900">
                  {new Date(service.dueDate).toLocaleDateString("pt-BR")}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Estatísticas</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium text-zinc-500">Tarefas</dt>
              <dd className="text-2xl font-semibold text-zinc-900">
                {service._count.tasks}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium text-zinc-500">Documentos</dt>
              <dd className="text-2xl font-semibold text-zinc-900">
                {service._count.documents}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium text-zinc-500">Propostas</dt>
              <dd className="text-2xl font-semibold text-zinc-900">
                {service._count.proposals}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium text-zinc-500">Contratos</dt>
              <dd className="text-2xl font-semibold text-zinc-900">
                {service._count.contracts}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium text-zinc-500">Registros de Trabalho</dt>
              <dd className="text-2xl font-semibold text-zinc-900">
                {service._count.workLogs}
              </dd>
            </div>
          </dl>
        </div>
      </div>

{service.client.email && (
         <div className="rounded-xl border bg-white p-6">
           <h2 className="mb-4 text-base font-semibold">Contato do Cliente</h2>
           <div className="space-y-2 text-sm">
             {service.client.email && (
               <p>
                 <span className="font-medium text-zinc-500">Email:</span>{" "}
                 {service.client.email}
               </p>
             )}
             {service.client.phone && (
               <p>
                 <span className="font-medium text-zinc-500">Telefone:</span>{" "}
                 {service.client.phone}
               </p>
             )}
           </div>
         </div>
       )}

       <div className="rounded-xl border bg-white p-6">
         <h2 className="mb-4 text-base font-semibold">Tarefas</h2>
         <ServiceTaskList data={tasks} serviceId={serviceId} />
         <div className="mt-6 border-t pt-4">
           <h3 className="mb-2 text-sm font-medium text-zinc-700">Nova Tarefa</h3>
           <ServiceTaskForm action={handleCreateTask} serviceId={serviceId} />
         </div>
       </div>
     </div>
  );
}
