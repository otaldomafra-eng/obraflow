interface ProposalStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Rascunho", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  SENT: { label: "Enviada", className: "bg-blue-50 text-blue-700 border-blue-200" },
  ACCEPTED: { label: "Aceita", className: "bg-green-50 text-green-700 border-green-200" },
  REJECTED: { label: "Recusada", className: "bg-red-50 text-red-700 border-red-200" },
  CANCELED: { label: "Cancelada", className: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

export function ProposalStatusBadge({ status }: ProposalStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-zinc-100 text-zinc-700 border-zinc-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
