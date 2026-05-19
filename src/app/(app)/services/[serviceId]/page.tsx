import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getServiceDetail } from "@/features/services/actions";
import {
  createServiceTask,
  listServiceTasks,
  reorderServiceTasks,
} from "@/features/service-tasks/actions";
import { ServiceTaskForm } from "@/features/service-tasks/ServiceTaskForm";
import { ServiceTaskSortableList } from "@/features/service-tasks/ServiceTaskSortableList";
import { requireTenantId } from "@/server/auth/tenant";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { typeLabels } from "@/components/ui/status";
import { ProposalStatusBadge } from "@/features/proposals/ProposalStatusBadge";
import { listProposals } from "@/features/proposals/actions";
import { listDocuments } from "@/features/documents/actions";
import { DocumentVisibilityBadge } from "@/features/documents/DocumentVisibilityBadge";

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
  const proposals = await listProposals(tenantId, { serviceId });
  const documents = await listDocuments(tenantId, { serviceId });

  async function handleCreateTask(formData: FormData) {
    "use server";

    await createServiceTask(tenantId, {
      serviceId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      status:
        (formData.get("status") as
          | "PLANNING"
          | "PRODUCTION"
          | "DELIVERED"
          | "CANCELED") || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
    });

    revalidatePath(`/services/${serviceId}`);
  }

  async function handleReorder(taskIds: string[]) {
    "use server";
    await reorderServiceTasks(tenantId, serviceId, taskIds);
    revalidatePath(`/services/${serviceId}`);
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{service.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {typeLabels[service.type] || service.type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={service.status} />
          <Link
            href={`/services/${service.id}/edit`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Editar
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Informações</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-zinc-500">Cliente</dt>
              <dd className="text-sm text-zinc-900">
                <Link
                  href={`/clients/${service.client.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {service.client.name}
                </Link>
              </dd>
            </div>
            {service.property && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">Imóvel</dt>
                <dd className="text-sm text-zinc-900">
                  <Link
                    href={`/properties/${service.property.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {service.property.name}
                  </Link>
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

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Estatísticas</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium text-zinc-500">Tarefas</dt>
              <dd className="text-2xl font-semibold text-zinc-900 tabular-nums">
                {service._count.tasks}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium text-zinc-500">Documentos</dt>
              <dd className="text-2xl font-semibold text-zinc-900 tabular-nums">
                {service._count.documents}
              </dd>
            </div>
            <Link
              href="/proposals?status=DRAFT"
              className="rounded-lg bg-zinc-50 p-4 transition-colors hover:bg-zinc-100"
            >
              <dt className="text-xs font-medium text-zinc-500">Propostas</dt>
              <dd className="text-2xl font-semibold text-zinc-900 tabular-nums">
                {service._count.proposals}
              </dd>
            </Link>
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium text-zinc-500">Contratos</dt>
              <dd className="text-2xl font-semibold text-zinc-900 tabular-nums">
                {service._count.contracts}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium text-zinc-500">Registros de Trabalho</dt>
              <dd className="text-2xl font-semibold text-zinc-900 tabular-nums">
                {service._count.workLogs}
              </dd>
            </div>
          </dl>
        </div>
      </div>

{(service.client.email || service.client.phone) && (
         <div className="rounded-xl border border-zinc-200 bg-white p-6">
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

      <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">Propostas</h2>
            <Link
              href={`/proposals/new?serviceId=${serviceId}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Criar Proposta →
            </Link>
          </div>
          {proposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <p className="text-sm text-zinc-400">Nenhuma proposta vinculada a este serviço.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {proposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{proposal.title}</p>
                    {proposal.validUntil && (
                      <p className="text-xs text-zinc-400">
                        Validade: {new Intl.DateTimeFormat("pt-BR").format(new Date(proposal.validUntil))}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <ProposalStatusBadge status={proposal.status} />
                    <span className="text-sm tabular-nums text-zinc-900">
                      {proposal.totalAmount
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(proposal.totalAmount))
                        : "—"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Documentos</h2>
          <Link
            href={`/documents/new?serviceId=${serviceId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Adicionar Documento →
          </Link>
        </div>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <p className="text-sm text-zinc-400">Nenhum documento vinculado a este serviço.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="truncate text-sm font-medium text-zinc-900 hover:text-blue-600"
                  >
                    {doc.title}
                  </Link>
                  <p className="text-xs text-zinc-400">{doc.mimeType ?? "—"}</p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <DocumentVisibilityBadge visibility={doc.visibility} />
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Abrir →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-semibold">Tarefas</h2>
         </div>
         <div className="p-6">
           <ServiceTaskSortableList
             initialData={tasks}
             serviceId={serviceId}
             onReorder={handleReorder}
           />
         </div>
         <div className="border-t border-zinc-100 px-6 py-4">
           <h3 className="mb-2 text-sm font-medium text-zinc-700">Nova Tarefa</h3>
           <ServiceTaskForm action={handleCreateTask} serviceId={serviceId} />
         </div>
       </div>
     </div>
  );
}
