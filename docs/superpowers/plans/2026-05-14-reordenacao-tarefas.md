# Reordenação de Tarefas (ServiceTask sortOrder + @dnd-kit)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar campo `sortOrder` ao `ServiceTask`, permitir reordenação persistida via drag-and-drop (@dnd-kit) com fallback acessível, e cobrir com testes unitários e de integração.

**Architecture:** Campo `sortOrder Int @default(0)` no Prisma; listagem ordenada por `sortOrder asc, createdAt asc`; action `reorderServiceTasks` recebe array de `taskIds` e atualiza em transação; UI usa `@dnd-kit/sortable` com botões de mover para cima/baixo como fallback acessível.

**Tech Stack:** Next.js 16, React 19, Prisma 7, PostgreSQL, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, Vitest

---

## File Structure

| File | Responsibility |
|------|--------------|
| `prisma/schema.prisma` | Adiciona `sortOrder` ao model `ServiceTask` |
| `src/features/service-tasks/actions.ts` | `listServiceTasks` orderBy; nova action `reorderServiceTasks` |
| `src/features/service-tasks/ServiceTaskSortableList.tsx` | Componente drag-and-drop + botões de fallback |
| `src/app/(app)/services/[serviceId]/page.tsx` | Usa `ServiceTaskSortableList` em vez de `ServiceTaskList` |
| `tests/unit/features/service-tasks/actions-reorder.test.ts` | Testes unitários da action com mocks |
| `tests/integration/actions/service-tasks.test.ts` | Testes de integração da reordenação |

---

## Pré-requisitos do Ambiente

O projeto usa PostgreSQL via Prisma. A migration deve ser criada com `prisma migrate dev`. O cliente Prisma deve ser regenerado com `prisma generate`.

---

### Task 1: Adicionar campo sortOrder ao Prisma schema

**Files:**
- Modify: `prisma/schema.prisma:342-369`

- [ ] **Step 1: Adicionar `sortOrder Int @default(0)` ao model `ServiceTask`**

```prisma
model ServiceTask {
  id           String            @id @default(cuid())
  tenantId     String
  externalKey  String?
  serviceId    String
  phaseId      String?
  assigneeId   String?
  title        String
  description  String?
  status       ServiceStatus     @default(PLANNING)
  sortOrder    Int               @default(0)
  dueDate      DateTime?
  completedAt  DateTime?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  tenant       Tenant            @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  service      Service           @relation(fields: [tenantId, serviceId], references: [tenantId, id], onDelete: Restrict)
  phase        ProjectPhase?     @relation(fields: [tenantId, serviceId, phaseId], references: [tenantId, serviceId, id], onDelete: Restrict)
  assignee     Membership?       @relation(fields: [tenantId, assigneeId], references: [tenantId, userId], onDelete: NoAction)
  workLogs     WorkLog[]
  measurements WorkMeasurement[]

  @@unique([tenantId, id])
  @@unique([tenantId, serviceId, id])
  @@unique([tenantId, externalKey])
  @@index([tenantId, serviceId])
  @@index([tenantId, serviceId, phaseId])
  @@index([tenantId, assigneeId])
}
```

- [ ] **Step 2: Criar migration e regenerar cliente**

Run: `pnpm db:migrate --name add_sort_order_to_service_task`
Expected: Migration criada em `prisma/migrations/`

Run: `pnpm db:generate`
Expected: Prisma client atualizado

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(prisma): add sortOrder to ServiceTask"
```

---

### Task 2: Atualizar listServiceTasks e criar reorderServiceTasks

**Files:**
- Modify: `src/features/service-tasks/actions.ts`
- Test: `tests/unit/features/service-tasks/actions-reorder.test.ts` (novo)

- [ ] **Step 1: Escrever teste unitário falhante para `reorderServiceTasks`**

Create: `tests/unit/features/service-tasks/actions-reorder.test.ts`

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    serviceTask: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    service: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { reorderServiceTasks } from "@/features/service-tasks/actions";

describe("reorderServiceTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates sortOrder for each taskId in order", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "service-1" });
    prismaMock.serviceTask.findMany.mockResolvedValue([
      { id: "task-a" },
      { id: "task-b" },
      { id: "task-c" },
    ]);

    await reorderServiceTasks("tenant-1", "service-1", [
      "task-c",
      "task-a",
      "task-b",
    ]);

    expect(prismaMock.serviceTask.update).toHaveBeenCalledTimes(3);
    expect(prismaMock.serviceTask.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "task-c" } },
      data: { sortOrder: 0 },
    });
    expect(prismaMock.serviceTask.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "task-a" } },
      data: { sortOrder: 1 },
    });
    expect(prismaMock.serviceTask.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "task-b" } },
      data: { sortOrder: 2 },
    });
  });

  it("rejects when a taskId does not belong to the service", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "service-1" });
    prismaMock.serviceTask.findMany.mockResolvedValue([
      { id: "task-a" },
      { id: "task-b" },
    ]);

    await expect(
      reorderServiceTasks("tenant-1", "service-1", [
        "task-a",
        "task-b",
        "task-c",
      ]),
    ).rejects.toThrow(/does not belong to service/);

    expect(prismaMock.serviceTask.update).not.toHaveBeenCalled();
  });

  it("rejects when service does not belong to tenant", async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);

    await expect(
      reorderServiceTasks("tenant-1", "service-1", ["task-a"]),
    ).rejects.toThrow(/does not belong to tenant/);
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

Run: `pnpm test tests/unit/features/service-tasks/actions-reorder.test.ts`
Expected: FAIL — `reorderServiceTasks` not exported

- [ ] **Step 3: Implementar `reorderServiceTasks` e atualizar `listServiceTasks`**

Modify: `src/features/service-tasks/actions.ts`

Adicionar schema e action ao final do arquivo (antes do último export):

```typescript
const reorderServiceTasksSchema = z.object({
  taskIds: z.array(z.string().min(1)).min(2),
});

export async function reorderServiceTasks(
  tenantId: string,
  serviceId: string,
  taskIds: string[],
) {
  reorderServiceTasksSchema.parse({ taskIds });

  await assertServiceBelongsToTenant(tenantId, serviceId);

  const tasks = await prisma.serviceTask.findMany({
    where: { tenantId, serviceId, id: { in: taskIds } },
    select: { id: true },
  });

  if (tasks.length !== taskIds.length) {
    throw new Error(
      `One or more tasks do not belong to service ${serviceId} in tenant ${tenantId}`,
    );
  }

  const updates = taskIds.map((id, index) =>
    prisma.serviceTask.update({
      where: { tenantId_id: { tenantId, id } },
      data: { sortOrder: index },
    }),
  );

  await prisma.$transaction(updates);
}
```

E modificar `listServiceTasks` (linha 135):

```typescript
export async function listServiceTasks(tenantId: string, serviceId: string) {
  await assertServiceBelongsToTenant(tenantId, serviceId);

  return prisma.serviceTask.findMany({
    where: { tenantId, serviceId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { workLogs: true } },
    },
  });
}
```

- [ ] **Step 4: Rodar testes para confirmar que passam**

Run: `pnpm test tests/unit/features/service-tasks/actions-reorder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/service-tasks/actions.ts tests/unit/features/service-tasks/actions-reorder.test.ts
git commit -m "feat(service-tasks): add reorder action and sort by sortOrder"
```

---

### Task 3: Instalar @dnd-kit

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar pacotes**

Run: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
Expected: Pacotes adicionados às dependencies

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add @dnd-kit for drag-and-drop"
```

---

### Task 4: Criar ServiceTaskSortableList com drag-and-drop + fallback

**Files:**
- Create: `src/features/service-tasks/ServiceTaskSortableList.tsx`
- Create: `src/features/service-tasks/ServiceTaskList.tsx` (substituir por compatibilidade, ou criar novo componente)

Decisão: manter `ServiceTaskList` para listagem estática e criar `ServiceTaskSortableList` que envolve com DnD. A página usará o sortable.

- [ ] **Step 1: Criar componente SortableItem**

Create: `src/features/service-tasks/SortableTaskItem.tsx`

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";

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

const statusColors: Record<string, string> = {
  PLANNING: "bg-purple-50 text-purple-700",
  PRODUCTION: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELED: "bg-red-50 text-red-700",
};

const statusLabels: Record<string, string> = {
  PLANNING: "Planejamento",
  PRODUCTION: "Em Produção",
  DELIVERED: "Entregue",
  CANCELED: "Cancelada",
};

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
      className={`hover:bg-zinc-50 ${isDragging ? "opacity-50" : ""}`}
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
            ⋮⋮
          </button>
          <Link
            href={`/services/${serviceId}/tasks/${id}`}
            className="hover:underline"
          >
            {title}
          </Link>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            statusColors[status] || "bg-gray-50 text-gray-600"
          }`}
        >
          {statusLabels[status] || status}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
        {dueDate ? new Date(dueDate).toLocaleDateString("pt-BR") : "-"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-600">
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
```

- [ ] **Step 2: Criar ServiceTaskSortableList**

Create: `src/features/service-tasks/ServiceTaskSortableList.tsx`

```tsx
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((t) => t.id === active.id);
      const newIndex = items.findIndex((t) => t.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      await onReorder(newItems.map((t) => t.id));
    },
    [items, onReorder],
  );

  const handleMove = useCallback(
    async (index: number, direction: -1 | 1) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= items.length) return;

      const newItems = arrayMove(items, index, newIndex);
      setItems(newItems);

      await onReorder(newItems.map((t) => t.id));
    },
    [items, onReorder],
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
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/service-tasks/SortableTaskItem.tsx src/features/service-tasks/ServiceTaskSortableList.tsx
git commit -m "feat(service-tasks): add sortable list with drag-and-drop and accessible move buttons"
```

---

### Task 5: Atualizar página de serviço para usar sortable list

**Files:**
- Modify: `src/app/(app)/services/[serviceId]/page.tsx`

- [ ] **Step 1: Adicionar server action wrapper para reorder**

Na página, adicionar import e action:

```tsx
import { reorderServiceTasks } from "@/features/service-tasks/actions";
import { ServiceTaskSortableList } from "@/features/service-tasks/ServiceTaskSortableList";
```

E substituir o uso de `ServiceTaskList`:

```tsx
async function handleReorder(taskIds: string[]) {
  "use server";
  await reorderServiceTasks(tenantId, serviceId, taskIds);
  revalidatePath(`/services/${serviceId}`);
}
```

E no JSX:

```tsx
<ServiceTaskSortableList
  initialData={tasks}
  serviceId={serviceId}
  onReorder={handleReorder}
/>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/services/[serviceId]/page.tsx
git commit -m "feat(services): use sortable task list on service detail page"
```

---

### Task 6: Adicionar testes de integração para reorder

**Files:**
- Modify: `tests/integration/actions/service-tasks.test.ts`

- [ ] **Step 1: Adicionar testes de integração ao arquivo existente**

Adicionar ao `describe` existente (antes do fechamento final):

```typescript
  it("reorders tasks and persists sortOrder", async () => {
    const suffix = `reorder-${Date.now()}`;
    const client = await createClient(tenantId, {
      name: `Client ${suffix}`,
      kind: "PERSON",
    });
    const service = await createService(tenantId, {
      clientId: client.id,
      title: `Service ${suffix}`,
      type: "FIRE_SAFETY",
    });
    const taskA = await createServiceTask(tenantId, {
      serviceId: service.id,
      title: `Task A ${suffix}`,
    });
    const taskB = await createServiceTask(tenantId, {
      serviceId: service.id,
      title: `Task B ${suffix}`,
    });
    const taskC = await createServiceTask(tenantId, {
      serviceId: service.id,
      title: `Task C ${suffix}`,
    });

    await reorderServiceTasks(tenantId, service.id, [
      taskC.id,
      taskA.id,
      taskB.id,
    ]);

    const tasks = await prisma.serviceTask.findMany({
      where: { tenantId, serviceId: service.id },
      orderBy: { sortOrder: "asc" },
    });

    expect(tasks.map((t) => t.id)).toEqual([taskC.id, taskA.id, taskB.id]);
    expect(tasks[0].sortOrder).toBe(0);
    expect(tasks[1].sortOrder).toBe(1);
    expect(tasks[2].sortOrder).toBe(2);
  });

  it("does not reorder tasks from another service", async () => {
    const suffix = `reorder-wrong-${Date.now()}`;
    const client = await createClient(tenantId, {
      name: `Client ${suffix}`,
      kind: "PERSON",
    });
    const serviceA = await createService(tenantId, {
      clientId: client.id,
      title: `Service A ${suffix}`,
      type: "FIRE_SAFETY",
    });
    const serviceB = await createService(tenantId, {
      clientId: client.id,
      title: `Service B ${suffix}`,
      type: "FIRE_SAFETY",
    });
    const taskA = await createServiceTask(tenantId, {
      serviceId: serviceA.id,
      title: `Task A ${suffix}`,
    });
    const taskB = await createServiceTask(tenantId, {
      serviceId: serviceB.id,
      title: `Task B ${suffix}`,
    });

    await expect(
      reorderServiceTasks(tenantId, serviceA.id, [taskA.id, taskB.id]),
    ).rejects.toThrow(/does not belong to service/);
  });
```

E adicionar o import:

```typescript
import { createServiceTask, deleteServiceTask, reorderServiceTasks } from "@/features/service-tasks/actions";
```

- [ ] **Step 2: Rodar testes de integração (se RUN_DB_TESTS=1)**

Run: `RUN_DB_TESTS=1 pnpm test tests/integration/actions/service-tasks.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/integration/actions/service-tasks.test.ts
git commit -m "test(integration): add reorder service task tests"
```

---

### Task 7: Rodar gates finais

- [ ] **Step 1: Rodar lint**

Run: `pnpm lint`
Expected: clean

- [ ] **Step 2: Rodar typecheck**

Run: `pnpm typecheck`
Expected: clean

- [ ] **Step 3: Rodar testes unitários**

Run: `pnpm test`
Expected: all pass

- [ ] **Step 4: Rodar build**

Run: `pnpm build`
Expected: clean

- [ ] **Step 5: Commit final se houver alterações**

```bash
git diff --quiet || git commit -am "chore: fix lint/type issues after sortOrder feature"
```

---

## Spec Coverage Check

| Requisito | Task |
|-----------|------|
| Campo `sortOrder` no Prisma | Task 1 |
| Migration sem alterar outras partes | Task 1 |
| `listServiceTasks` ordena por `sortOrder` | Task 2 |
| Action para persistir nova ordem | Task 2 |
| Validação `tenantId + serviceId` | Task 2 |
| Validação que taskIds pertencem ao serviço | Task 2 |
| UI drag-and-drop | Task 4 |
| Fallback acessível (botões) | Task 4 |
| Testes unitários: ordenação, rejeição cross-service, persistência | Task 2 |
| Testes integração: persistência, rejeição cross-service | Task 6 |
| Rodar lint/typecheck/test/build | Task 7 |

---

## Placeholder Scan

Nenhum placeholder detectado. Todo o código necessário está presente nos steps.
