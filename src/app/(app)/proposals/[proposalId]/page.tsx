import Link from "next/link";
import { notFound } from "next/navigation";

import { requireTenantId } from "@/server/auth/tenant";
import { ProposalDetail } from "@/features/proposals/ProposalDetail";
import { getProposal } from "@/features/proposals/actions";
import { listContracts } from "@/features/contracts/actions";
import { ContractStatusBadge } from "@/features/contracts/ContractStatusBadge";
import { listDocuments } from "@/features/documents/actions";
import { DocumentVisibilityBadge } from "@/features/documents/DocumentVisibilityBadge";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { proposalId } = await params;

  const proposal = await getProposal(tenantId, proposalId);

  if (!proposal) notFound();

  const [contracts, documents] = await Promise.all([
    listContracts(tenantId, { serviceId: proposal.serviceId, proposalId }),
    listDocuments(tenantId, { serviceId: proposal.serviceId, proposalId }),
  ]);

  return (
    <div className="space-y-6">
      <ProposalDetail proposal={proposal} />

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Contratos</h2>
          <Link
            href={`/contracts/new?serviceId=${proposal.serviceId}&proposalId=${proposalId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Criar Contrato →
          </Link>
        </div>
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <p className="text-sm text-zinc-400">Nenhum contrato vinculado a esta proposta.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {contracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    <span className="font-mono text-zinc-400">{contract.number}</span>
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <ContractStatusBadge status={contract.status} />
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
            href={`/documents/new?serviceId=${proposal.serviceId}&proposalId=${proposalId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Adicionar Documento →
          </Link>
        </div>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <p className="text-sm text-zinc-400">Nenhum documento vinculado a esta proposta.</p>
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
    </div>
  );
}
