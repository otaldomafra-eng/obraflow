"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { SortableTaskItem } from "./SortableTaskItem";
import type { listServiceTasks } from "./actions";

interface ServiceTaskSortableListProps {
  initialData: Awaited<ReturnType<typeof listServiceTasks>>;
  serviceId: string;
  onReorder: (taskIds: string[]) => Promise<void>;
}

export function ServiceTaskSortableList({
  initialData,
  serviceId,
  onReorder,
}: ServiceTaskSortableListProps) {
  const [items, setItems] = useState(initialData);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const reorderWithRollback = useCallback(
    async (newItems: typeof items) => {
      const previousItems = items;
      setItems(newItems);
      setError(null);

      try {
        await onReorder(newItems.map((t) => t.id));
      } catch (e) {
        setItems(previousItems);
        setError(
          e instanceof Error ? e.message : "Erro ao reordenar tarefas",
        );
      }
    },
    [items, onReorder],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((t) => t.id === active.id);
      const newIndex = items.findIndex((t) => t.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);

      await reorderWithRollback(newItems);
    },
    [items, reorderWithRollback],
  );

  const handleMove = useCallback(
    async (index: number, direction: -1 | 1) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= items.length) return;

      const newItems = arrayMove(items, index, newIndex);
      await reorderWithRollback(newItems);
    },
    [items, reorderWithRollback],
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tarefa
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Vencimento
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Registros
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Ordenar
            </th>
          </tr>
        </thead>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody className="divide-y divide-zinc-100">
              {items.map((task, index) => (
                <SortableTaskItem
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  status={task.status}
                  dueDate={task.dueDate}
                  workLogCount={task._count.workLogs}
                  serviceId={serviceId}
                  onMoveUp={() => handleMove(index, -1)}
                  onMoveDown={() => handleMove(index, 1)}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                />
              ))}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>

      {items.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-zinc-400">
          Nenhuma tarefa criada ainda.
        </div>
      )}

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
