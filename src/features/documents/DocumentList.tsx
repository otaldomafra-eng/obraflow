import Link from "next/link";

import type { listDocuments } from "./actions";
import { DocumentVisibilityBadge } from "./DocumentVisibilityBadge";

interface Props {
  documents: Awaited<ReturnType<typeof listDocuments>>;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function DocumentList({ documents }: Props) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <p className="text-sm text-zinc-400">Nenhum documento encontrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left text-xs font-medium text-zinc-500">
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Serviço</th>
            <th className="px-4 py-3">Proposta</th>
            <th className="px-4 py-3">Visibilidade</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {documents.map((doc) => (
            <tr key={doc.id} className="transition-colors hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link
                  href={`/documents/${doc.id}`}
                  className="font-medium text-zinc-900 hover:text-blue-600 transition-colors"
                >
                  {doc.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-500">
                <Link
                  href={`/services/${doc.service.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {doc.service.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {doc.proposal ? (
                  <Link
                    href={`/proposals/${doc.proposal.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {doc.proposal.title}
                  </Link>
                ) : (
                  <span className="text-zinc-300">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <DocumentVisibilityBadge visibility={doc.visibility} />
              </td>
              <td className="px-4 py-3 text-zinc-500">{doc.mimeType ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-500 tabular-nums">{formatDate(doc.createdAt)}</td>
              <td className="px-4 py-3">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Abrir →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
