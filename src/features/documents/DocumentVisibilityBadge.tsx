const labels: Record<string, string> = {
  INTERNAL: "Interno",
  CLIENT_VISIBLE: "Visível ao Cliente",
  SUPPLIER_VISIBLE: "Visível ao Fornecedor",
};

const colors: Record<string, string> = {
  INTERNAL: "bg-zinc-50 text-zinc-600 border-zinc-200",
  CLIENT_VISIBLE: "bg-blue-50 text-blue-700 border-blue-200",
  SUPPLIER_VISIBLE: "bg-amber-50 text-amber-700 border-amber-200",
};

export function DocumentVisibilityBadge({ visibility }: { visibility: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[visibility] ?? colors.INTERNAL}`}
    >
      {labels[visibility] ?? visibility}
    </span>
  );
}
