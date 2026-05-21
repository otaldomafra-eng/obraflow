import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPortalService } from "@/features/services/actions";

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

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const service = await getPortalService(token);

  if (!service) {
    notFound();
  }

  const lastTask = service.tasks[0] ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-900">Acompanhamento de Serviço</h1>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400">Cliente</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">{service.client.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400">Serviço</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900">{service.title}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400">Status</dt>
              <dd className="mt-0.5">
                <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {statusLabels[service.status] || service.status}
                </span>
              </dd>
            </div>
            {service.dueDate && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400">Prazo</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">
                  {new Date(service.dueDate).toLocaleDateString("pt-BR")}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {lastTask && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Última Atividade</h2>
            <p className="text-sm text-zinc-700">{lastTask.title}</p>
            {lastTask.completedAt && (
              <p className="mt-1 text-xs text-zinc-400">
                Concluída em {new Date(lastTask.completedAt).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        )}

        {service.documents.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Documentos</h2>
            <ul className="divide-y divide-zinc-100">
              {service.documents.map((doc) => (
                <li key={doc.id} className="py-2 first:pt-0 last:pb-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-500"
                  >
                    <span className="truncate">{doc.title}</span>
                    <span className="ml-2 shrink-0">Abrir →</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-xs text-zinc-400">
          {service.client.name} — ObraFlow
        </p>
      </div>
    </div>
  );
}
