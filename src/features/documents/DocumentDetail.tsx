import Link from "next/link";

import type { getDocument } from "./actions";
import { DocumentVisibilityBadge } from "./DocumentVisibilityBadge";

interface Props {
  document: NonNullable<Awaited<ReturnType<typeof getDocument>>>;
}

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function DocumentDetail({ document: doc }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{doc.title}</h1>
          <DocumentVisibilityBadge visibility={doc.visibility} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">Informações</h2>
        <dl className="divide-y divide-zinc-100">
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Serviço</dt>
            <dd className="text-sm text-zinc-900">
              <Link
                href={`/services/${doc.service.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {doc.service.title}
              </Link>
            </dd>
          </div>
          {doc.proposal && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Proposta</dt>
              <dd className="text-sm text-zinc-900">
                <Link
                  href={`/proposals/${doc.proposal.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {doc.proposal.title}
                </Link>
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">URL</dt>
            <dd className="text-sm text-zinc-900">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 transition-colors break-all"
              >
                {doc.url}
              </a>
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Visibilidade</dt>
            <dd className="text-sm">
              <DocumentVisibilityBadge visibility={doc.visibility} />
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Tipo</dt>
            <dd className="text-sm text-zinc-900">{doc.mimeType ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Criado em</dt>
            <dd className="text-sm text-zinc-900 tabular-nums">{formatDate(doc.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Atualizado em</dt>
            <dd className="text-sm text-zinc-900 tabular-nums">{formatDate(doc.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-6 py-4">
        <Link
          href={`/services/${doc.service.id}`}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          ← Voltar ao serviço
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Abrir Arquivo →
          </a>
          <Link
            href={`/documents/${doc.id}/edit`}
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
}
