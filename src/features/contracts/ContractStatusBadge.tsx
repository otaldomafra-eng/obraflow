interface ContractStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Rascunho", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  ISSUED: { label: "Emitido", className: "bg-blue-50 text-blue-700 border-blue-200" },
  SIGNED: { label: "Assinado", className: "bg-green-50 text-green-700 border-green-200" },
  COMPLETED: { label: "Concluído", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Cancelado", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
