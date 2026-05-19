"use client";

import { useState, useCallback, useEffect } from "react";
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initialData);
  }, [initialData]);

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
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="min-w-full divide-y divide-zinc-200">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Tarefa
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Vencimento
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Registros
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Ordenar
              </th>
            </tr>
          </thead>
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
        </table>
      </DndContext>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.008v.008H9V12Zm0-3h.008v.008H9V9Zm3 3h.008v.008H12V12Zm0-3h.008v.008H12V9Zm3 3h.008v.008H15V12Zm0-3h.008v.008H15V9Z" />
          </svg>
          <p className="text-sm text-zinc-400">Nenhuma tarefa criada ainda.</p>
          <span className="mt-2 text-xs text-zinc-400">
            Use o formulário abaixo para criar a primeira tarefa.
          </span>
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
