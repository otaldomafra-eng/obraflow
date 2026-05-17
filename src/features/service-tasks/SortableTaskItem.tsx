"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { taskStatusLabels, taskStatusColors } from "@/components/ui/status";

interface SortableTaskItemProps {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  workLogCount: number;
  serviceId: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function SortableTaskItem({
  id,
  title,
  status,
  dueDate,
  workLogCount,
  serviceId,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-zinc-50 transition-colors ${isDragging ? "opacity-50" : ""}`}
    >
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
            aria-label="Arrastar tarefa"
            title="Arrastar"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Link
            href={`/services/${serviceId}/tasks/${id}`}
            className="hover:text-blue-600 transition-colors"
          >
            {title}
          </Link>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm">
        <StatusBadge status={status} labels={taskStatusLabels} colors={taskStatusColors} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
        {dueDate ? new Date(dueDate).toLocaleDateString("pt-BR") : "-"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-zinc-600">
        {workLogCount}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
            aria-label="Mover para cima"
            title="Mover para cima"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
            aria-label="Mover para baixo"
            title="Mover para baixo"
          >
            ↓
          </button>
        </div>
      </td>
    </tr>
  );
}
