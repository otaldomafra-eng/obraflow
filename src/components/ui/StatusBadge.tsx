import { statusColors, statusLabels } from "./status";

interface StatusBadgeProps {
  status: string;
  colors?: Record<string, string>;
  labels?: Record<string, string>;
}

export function StatusBadge({
  status,
  colors = statusColors,
  labels = statusLabels,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        colors[status] || "bg-zinc-50 text-zinc-600 ring-zinc-200"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
