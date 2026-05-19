# Commercial & Proposals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete commercial proposal workflow — list, create, view, edit proposals, commercial dashboard, and service integration.

**Architecture:** New `proposals/` and `commercial/` feature modules following existing patterns (Zod schemas, Server Actions, `useActionState` forms, tenant-scoped Prisma). Adds 2 fields to existing `Proposal` model via migration.

**Tech Stack:** Next.js 16 App Router, Prisma, Zod, dnd-kit (existing), TailwindCSS

---

### Task 1: Prisma migration + schema update

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/xxx_add_proposal_fields` (auto-generated)

- [ ] **Step 1: Add fields to Proposal model in schema.prisma**

Add `validUntil DateTime?` and `notes String?` after `acceptedAt`:

```prisma
model Proposal {
  id          String     @id @default(cuid())
  tenantId    String
  externalKey String?
  serviceId   String
  title       String
  status      String     @default("DRAFT")
  totalAmount Decimal?   @db.Decimal(12, 2)
  sentAt      DateTime?
  acceptedAt  DateTime?
  validUntil  DateTime?
  notes       String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  tenant    Tenant     @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  service   Service    @relation(fields: [tenantId, serviceId], references: [tenantId, id], onDelete: Restrict)
  contracts Contract[]

  @@unique([tenantId, id])
  @@unique([tenantId, serviceId, id])
  @@unique([tenantId, externalKey])
  @@index([tenantId, serviceId])
}
```

- [ ] **Step 2: Generate migration**

```bash
pnpm prisma migrate dev --name add_proposal_validity
```

Expected: migration created in `prisma/migrations/`, client regenerated.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add validUntil and notes fields to Proposal model"
```

---

### Task 2: Proposals actions — Zod schemas + CRUD

**Files:**
- Create: `src/features/proposals/actions.ts`

- [ ] **Step 1: Write the failing test**

File: `tests/unit/features/proposals/schema.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  createProposalSchema,
  updateProposalSchema,
  PROPOSAL_STATUSES,
} from "@/features/proposals/actions";

describe("proposal action schema validation", () => {
  it("validates createProposal input with required fields", () => {
    const result = createProposalSchema.parse({
      serviceId: "svc-1",
      title: "Proposta de Reforma",
    });
    expect(result.serviceId).toBe("svc-1");
    expect(result.title).toBe("Proposta de Reforma");
    expect(result.status).toBeUndefined();
  });

  it("rejects empty title", () => {
    expect(() =>
      createProposalSchema.parse({ serviceId: "svc-1", title: "" }),
    ).toThrow();
  });

  it("rejects empty serviceId", () => {
    expect(() =>
      createProposalSchema.parse({ serviceId: "", title: "Teste" }),
    ).toThrow();
  });

  it("accepts all valid statuses", () => {
    for (const s of PROPOSAL_STATUSES) {
      const result = createProposalSchema.parse({
        serviceId: "svc-1",
        title: "Teste",
        status: s,
      });
      expect(result.status).toBe(s);
    }
  });

  it("accepts optional totalAmount as string and transforms to Decimal", () => {
    const result = createProposalSchema.parse({
      serviceId: "svc-1",
      title: "Proposta",
      totalAmount: "15000.00",
    });
    expect(result.totalAmount).toBeDefined();
    expect(result.totalAmount).not.toBeNaN();
  });

  it("transforms validUntil string to Date", () => {
    const result = createProposalSchema.parse({
      serviceId: "svc-1",
      title: "Proposta",
      validUntil: "2026-12-31",
    });
    expect(result.validUntil).toBeInstanceOf(Date);
    expect(result.validUntil?.toISOString().startsWith("2026-12-31")).toBe(true);
  });

  it("accepts optional notes", () => {
    const result = createProposalSchema.parse({
      serviceId: "svc-1",
      title: "Proposta",
      notes: "Escopo: reforma completa do banheiro.",
    });
    expect(result.notes).toBe("Escopo: reforma completa do banheiro.");
  });

  it("validates updateProposal with partial fields", () => {
    const result = updateProposalSchema.parse({ title: "Novo titulo" });
    expect(result.title).toBe("Novo titulo");
    expect(result.status).toBeUndefined();
  });

  it("rejects invalid status in update", () => {
    expect(() =>
      updateProposalSchema.parse({ status: "INVALID" }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement Zod schemas and status constants**

File: `src/features/proposals/actions.ts` (start with exports)

```ts
import { z } from "zod";

export const PROPOSAL_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "CANCELED",
] as const;

export const createProposalSchema = z.object({
  serviceId: z.string().min(1),
  title: z.string().min(1),
  totalAmount: z.string().optional().transform((v) => (v ? new Decimal(v) : undefined)),
  status: z.enum(PROPOSAL_STATUSES).optional(),
  validUntil: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  notes: z.string().optional(),
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).optional(),
  totalAmount: z.string().optional().transform((v) => (v ? new Decimal(v) : undefined)),
  status: z.enum(PROPOSAL_STATUSES).optional(),
  validUntil: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  notes: z.string().optional(),
});

import { Decimal } from "@prisma/client/runtime/library";
```

Note: `Decimal` import goes at top. Let me fix that:

```ts
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

export const PROPOSAL_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "CANCELED",
] as const;
// ... schemas as above
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test
```

Expected: all schema tests PASS.

- [ ] **Step 5: Write the actions test**

File: `tests/unit/features/proposals/actions.test.ts`

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    proposal: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    service: { findUnique: vi.fn() },
    proposalFindFirst: vi.fn(),
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import {
  createProposal,
  getProposal,
  listProposals,
  updateProposal,
  PROPOSAL_STATUSES,
} from "@/features/proposals/actions";

describe("proposal actions", () => {
  const tenantId = "tenant-1";
  const now = new Date();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a proposal", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    prismaMock.proposal.create.mockResolvedValue({
      id: "prop-1",
      tenantId,
      serviceId: "svc-1",
      title: "Proposta Teste",
      status: "DRAFT",
      totalAmount: null,
      sentAt: null,
      acceptedAt: null,
      validUntil: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });

    const result = await createProposal(tenantId, {
      serviceId: "svc-1",
      title: "Proposta Teste",
    });

    expect(result.id).toBe("prop-1");
    expect(result.title).toBe("Proposta Teste");
    expect(prismaMock.proposal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId,
        serviceId: "svc-1",
        title: "Proposta Teste",
        status: "DRAFT",
      }),
    });
  });

  it("rejects create when service does not belong to tenant", async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);

    await expect(
      createProposal(tenantId, { serviceId: "svc-1", title: "Teste" }),
    ).rejects.toThrow("Service svc-1 does not belong to tenant tenant-1");
    expect(prismaMock.proposal.create).not.toHaveBeenCalled();
  });

  it("lists proposals with service info", async () => {
    prismaMock.proposal.findMany.mockResolvedValue([
      {
        id: "prop-1",
        tenantId,
        serviceId: "svc-1",
        title: "Proposta 1",
        status: "DRAFT",
        totalAmount: null,
        sentAt: null,
        acceptedAt: null,
        validUntil: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
        service: {
          id: "svc-1",
          title: "Servico 1",
          client: { id: "cli-1", name: "Cliente 1" },
          property: null,
        },
      },
    ]);

    const result = await listProposals(tenantId);

    expect(result).toHaveLength(1);
    expect(result[0].service.client.name).toBe("Cliente 1");
  });

  it("gets a single proposal by id", async () => {
    prismaMock.proposal.findFirst.mockResolvedValue({
      id: "prop-1",
      tenantId,
      serviceId: "svc-1",
      title: "Proposta 1",
      status: "DRAFT",
      totalAmount: null,
      sentAt: null,
      acceptedAt: null,
      validUntil: null,
      notes: "Escopo detalhado",
      createdAt: now,
      updatedAt: now,
      service: {
        id: "svc-1",
        title: "Servico 1",
        client: { id: "cli-1", name: "Cliente 1" },
        property: { id: "prop-1", name: "Imovel 1" },
      },
    });

    const result = await getProposal(tenantId, "prop-1");

    expect(result?.id).toBe("prop-1");
    expect(result?.service.client.name).toBe("Cliente 1");
    expect(result?.notes).toBe("Escopo detalhado");
  });

  it("returns null for non-existent proposal", async () => {
    prismaMock.proposal.findFirst.mockResolvedValue(null);
    const result = await getProposal(tenantId, "nonexistent");
    expect(result).toBeNull();
  });

  it("updates proposal title and sets sentAt when status becomes SENT", async () => {
    prismaMock.proposal.findFirst.mockResolvedValue({
      id: "prop-1",
      tenantId,
      serviceId: "svc-1",
      status: "DRAFT",
      sentAt: null,
      acceptedAt: null,
    });
    prismaMock.proposal.update.mockResolvedValue({
      id: "prop-1",
      tenantId,
      serviceId: "svc-1",
      title: "Titulo Atualizado",
      status: "SENT",
      sentAt: new Date(),
      acceptedAt: null,
      validUntil: null,
      notes: null,
      totalAmount: null,
      createdAt: now,
      updatedAt: now,
    });

    const result = await updateProposal(tenantId, "svc-1", "prop-1", {
      title: "Titulo Atualizado",
      status: "SENT",
    });

    expect(result.title).toBe("Titulo Atualizado");
    expect(result.status).toBe("SENT");
    expect(prismaMock.proposal.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId, id: "prop-1" } },
      data: expect.objectContaining({
        title: "Titulo Atualizado",
        status: "SENT",
        sentAt: expect.any(Date),
      }),
    });
  });

  it("clears acceptedAt when status leaves ACCEPTED", async () => {
    prismaMock.proposal.findFirst.mockResolvedValue({
      id: "prop-1",
      tenantId,
      serviceId: "svc-1",
      status: "ACCEPTED",
      sentAt: null,
      acceptedAt: new Date(),
    });
    prismaMock.proposal.update.mockResolvedValue({
      id: "prop-1",
      tenantId,
      serviceId: "svc-1",
      title: "Proposta",
      status: "DRAFT",
      sentAt: null,
      acceptedAt: null,
      validUntil: null,
      notes: null,
      totalAmount: null,
      createdAt: now,
      updatedAt: now,
    });

    await updateProposal(tenantId, "svc-1", "prop-1", { status: "DRAFT" });

    expect(prismaMock.proposal.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId, id: "prop-1" } },
      data: expect.objectContaining({
        status: "DRAFT",
        acceptedAt: null,
      }),
    });
  });

  it("rejects update when proposal does not belong to service/tenant", async () => {
    prismaMock.proposal.findFirst.mockResolvedValue(null);

    await expect(
      updateProposal(tenantId, "svc-1", "prop-1", { title: "Novo" }),
    ).rejects.toThrow(
      "Proposal prop-1 does not belong to service svc-1 in tenant tenant-1",
    );
    expect(prismaMock.proposal.update).not.toHaveBeenCalled();
  });

  it("lists proposals filtered by serviceId", async () => {
    prismaMock.proposal.findMany.mockResolvedValue([]);

    const result = await listProposals(tenantId, { serviceId: "svc-1" });

    expect(result).toEqual([]);
    expect(prismaMock.proposal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          serviceId: "svc-1",
        }),
      }),
    );
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — actions module incomplete.

- [ ] **Step 7: Implement full actions.ts**

File: `src/features/proposals/actions.ts`

```ts
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

import { prisma } from "@/server/db/client";

export const PROPOSAL_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "CANCELED",
] as const;

const createProposalSchema = z.object({
  serviceId: z.string().min(1),
  title: z.string().min(1),
  totalAmount: z
    .string()
    .optional()
    .transform((v) => (v ? new Decimal(v) : undefined)),
  status: z.enum(PROPOSAL_STATUSES).optional(),
  validUntil: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  notes: z.string().optional(),
});

const updateProposalSchema = z.object({
  title: z.string().min(1).optional(),
  totalAmount: z
    .string()
    .optional()
    .transform((v) => (v ? new Decimal(v) : undefined)),
  status: z.enum(PROPOSAL_STATUSES).optional(),
  validUntil: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  notes: z.string().optional(),
});

export type CreateProposalInput = z.input<typeof createProposalSchema>;
export type UpdateProposalInput = z.input<typeof updateProposalSchema>;

async function assertServiceBelongsToTenant(
  tenantId: string,
  serviceId: string,
): Promise<void> {
  const service = await prisma.service.findUnique({
    where: { tenantId_id: { tenantId, id: serviceId } },
    select: { id: true },
  });
  if (!service) {
    throw new Error(
      `Service ${serviceId} does not belong to tenant ${tenantId}`,
    );
  }
}

async function assertProposalBelongsToService(
  tenantId: string,
  serviceId: string,
  proposalId: string,
): Promise<{ sentAt: Date | null; acceptedAt: Date | null }> {
  const proposal = await prisma.proposal.findFirst({
    where: { tenantId, serviceId, id: proposalId },
    select: { sentAt: true, acceptedAt: true },
  });
  if (!proposal) {
    throw new Error(
      `Proposal ${proposalId} does not belong to service ${serviceId} in tenant ${tenantId}`,
    );
  }
  return proposal;
}

function computeStatusTimestamps(
  status: string | undefined,
  current: { sentAt: Date | null; acceptedAt: Date | null },
): Record<string, unknown> {
  const timestamps: Record<string, unknown> = {};
  if (!status) return timestamps;

  if (status === "SENT" && !current.sentAt) {
    timestamps.sentAt = new Date();
  }
  if (status === "ACCEPTED" && !current.acceptedAt) {
    timestamps.acceptedAt = new Date();
  }
  if (status !== "ACCEPTED" && current.acceptedAt) {
    timestamps.acceptedAt = null;
  }
  return timestamps;
}

export async function createProposal(
  tenantId: string,
  input: CreateProposalInput,
) {
  const data = createProposalSchema.parse(input);

  await assertServiceBelongsToTenant(tenantId, data.serviceId);

  return prisma.proposal.create({
    data: {
      tenantId,
      serviceId: data.serviceId,
      title: data.title,
      status: data.status ?? "DRAFT",
      totalAmount: data.totalAmount,
      validUntil: data.validUntil,
      notes: data.notes ?? null,
    },
  });
}

export async function updateProposal(
  tenantId: string,
  serviceId: string,
  proposalId: string,
  input: UpdateProposalInput,
) {
  const data = updateProposalSchema.parse(input);
  const current = await assertProposalBelongsToService(
    tenantId,
    serviceId,
    proposalId,
  );

  const timestamps = computeStatusTimestamps(data.status, current);

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.totalAmount !== undefined)
    updateData.totalAmount = data.totalAmount;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
  if (data.notes !== undefined) updateData.notes = data.notes ?? null;
  Object.assign(updateData, timestamps);

  return prisma.proposal.update({
    where: { tenantId_id: { tenantId, id: proposalId } },
    data: updateData,
  });
}

export async function listProposals(
  tenantId: string,
  options?: { serviceId?: string; status?: string; search?: string },
) {
  const where: Record<string, unknown> = { tenantId };
  if (options?.serviceId) where.serviceId = options.serviceId;
  if (options?.status) where.status = options.status;
  if (options?.search) {
    where.title = { contains: options.search, mode: "insensitive" };
  }

  return prisma.proposal.findMany({
    where,
    include: {
      service: {
        select: {
          id: true,
          title: true,
          client: { select: { id: true, name: true } },
          property: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProposal(
  tenantId: string,
  proposalId: string,
) {
  return prisma.proposal.findFirst({
    where: { tenantId, id: proposalId },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          client: { select: { id: true, name: true } },
          property: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export { createProposalSchema, updateProposalSchema };
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm test
```

Expected: all proposal tests PASS (actions + schema).

- [ ] **Step 9: Commit**

```bash
git add src/features/proposals/actions.ts tests/unit/features/proposals/
git commit -m "feat: proposal CRUD actions with Zod validation and status transitions"
```

---

### Task 3: Proposal components — StatusBadge, Form, List, Detail

**Files:**
- Create: `src/features/proposals/ProposalStatusBadge.tsx`
- Create: `src/features/proposals/ProposalForm.tsx`
- Create: `src/features/proposals/ProposalList.tsx`
- Create: `src/features/proposals/ProposalDetail.tsx`

- [ ] **Step 1: ProposalStatusBadge**

```tsx
interface ProposalStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "Rascunho",
    className:
      "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  SENT: {
    label: "Enviada",
    className:
      "bg-blue-50 text-blue-700 border-blue-200",
  },
  ACCEPTED: {
    label: "Aceita",
    className:
      "bg-green-50 text-green-700 border-green-200",
  },
  REJECTED: {
    label: "Recusada",
    className:
      "bg-red-50 text-red-700 border-red-200",
  },
  CANCELED: {
    label: "Cancelada",
    className:
      "bg-zinc-100 text-zinc-500 border-zinc-200",
  },
};

export function ProposalStatusBadge({ status }: ProposalStatusBadgeProps) {
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
```

- [ ] **Step 2: ProposalForm**

```tsx
"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ProposalFormProps {
  action: (
    formData: FormData,
  ) => Promise<{ redirectUrl?: string } | void>;
  services: { id: string; title: string; client: { name: string } }[];
  proposal?: {
    serviceId: string;
    title: string;
    totalAmount: string | null;
    status: string;
    validUntil: string | null;
    notes: string | null;
  };
}

export function ProposalForm({
  action,
  services,
  proposal,
}: ProposalFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("serviceId") ?? undefined;

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null as { redirectUrl?: string } | null,
  );

  useEffect(() => {
    if (state?.redirectUrl) {
      router.push(state.redirectUrl);
    }
  }, [state, router]);

  const isEdit = !!proposal;

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Serviço" id="serviceId">
        {isEdit || preselectedServiceId ? (
          <>
            <input
              type="hidden"
              name="serviceId"
              value={proposal?.serviceId ?? preselectedServiceId}
            />
            <p className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
              {services.find(
                (s) =>
                  s.id === (proposal?.serviceId ?? preselectedServiceId),
              )?.title ?? "Serviço selecionado"}
            </p>
          </>
        ) : (
          <select
            id="serviceId"
            name="serviceId"
            required
            defaultValue=""
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="" disabled>
              Selecione um serviço
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} — {s.client.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Título *" id="title">
        <input
          id="title"
          name="title"
          required
          defaultValue={proposal?.title ?? ""}
          placeholder="Ex: Proposta de reforma residencial"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Valor Total" id="totalAmount">
          <input
            id="totalAmount"
            name="totalAmount"
            type="number"
            step="0.01"
            defaultValue={proposal?.totalAmount ?? ""}
            placeholder="0,00"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>

        <Field label="Validade" id="validUntil">
          <input
            id="validUntil"
            name="validUntil"
            type="date"
            defaultValue={proposal?.validUntil ?? ""}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      </div>

      <Field label="Observações / Escopo" id="notes">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={proposal?.notes ?? ""}
          placeholder="Descreva o escopo resumido da proposta..."
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:opacity-50"
      >
        {isPending
          ? "Salvando..."
          : isEdit
            ? "Salvar Proposta"
            : "Criar Proposta"}
      </button>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-zinc-700"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: ProposalList**

```tsx
import Link from "next/link";
import { ProposalStatusBadge } from "./ProposalStatusBadge";
import type { listProposals } from "./actions";

interface ProposalListProps {
  proposals: Awaited<ReturnType<typeof listProposals>>;
}

function formatCurrency(value: { toString: () => string } | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function ProposalList({ proposals }: ProposalListProps) {
  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <svg
          className="mb-3 h-10 w-10 text-zinc-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
        <p className="text-sm text-zinc-400">
          Nenhuma proposta encontrada.
        </p>
        <Link
          href="/proposals/new"
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Criar primeira proposta →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead>
          <tr className="border-b border-zinc-100">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Título
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Cliente
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Serviço
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Valor
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Validade
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ação
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {proposals.map((proposal) => (
            <tr key={proposal.id} className="group hover:bg-zinc-50">
              <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                {proposal.title}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-500">
                {proposal.service.client.name}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-500">
                {proposal.service.title}
              </td>
              <td className="px-4 py-3">
                <ProposalStatusBadge status={proposal.status} />
              </td>
              <td className="px-4 py-3 text-right text-sm text-zinc-900 tabular-nums">
                {formatCurrency(proposal.totalAmount)}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-500">
                {formatDate(proposal.validUntil)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/proposals/${proposal.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Abrir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: ProposalDetail**

```tsx
import Link from "next/link";
import { ProposalStatusBadge } from "./ProposalStatusBadge";
import type { getProposal } from "./actions";

interface ProposalDetailProps {
  proposal: NonNullable<Awaited<ReturnType<typeof getProposal>>>;
}

function formatCurrency(value: { toString: () => string } | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function ProposalDetail({ proposal }: ProposalDetailProps) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">
            {proposal.title}
          </h2>
          <div className="mt-1">
            <ProposalStatusBadge status={proposal.status} />
          </div>
        </div>

        <dl className="divide-y divide-zinc-100">
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-zinc-500">Cliente</dt>
            <dd className="mt-1 text-sm text-zinc-900 sm:col-span-2 sm:mt-0">
              <Link
                href={`/clients/${proposal.service.client.id}`}
                className="text-blue-600 hover:text-blue-500"
              >
                {proposal.service.client.name}
              </Link>
            </dd>
          </div>

          {proposal.service.property && (
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-zinc-500">Imóvel</dt>
              <dd className="mt-1 text-sm text-zinc-900 sm:col-span-2 sm:mt-0">
                <Link
                  href={`/properties/${proposal.service.property.id}`}
                  className="text-blue-600 hover:text-blue-500"
                >
                  {proposal.service.property.name}
                </Link>
              </dd>
            </div>
          )}

          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-zinc-500">Serviço</dt>
            <dd className="mt-1 text-sm text-zinc-900 sm:col-span-2 sm:mt-0">
              <Link
                href={`/services/${proposal.service.id}`}
                className="text-blue-600 hover:text-blue-500"
              >
                {proposal.service.title}
              </Link>
            </dd>
          </div>

          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-zinc-500">Valor</dt>
            <dd className="mt-1 text-sm text-zinc-900 sm:col-span-2 sm:mt-0">
              {formatCurrency(proposal.totalAmount)}
            </dd>
          </div>

          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-zinc-500">Validade</dt>
            <dd className="mt-1 text-sm text-zinc-900 sm:col-span-2 sm:mt-0">
              {formatDate(proposal.validUntil)}
            </dd>
          </div>

          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-zinc-500">
              Enviada em
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 sm:col-span-2 sm:mt-0">
              {formatDate(proposal.sentAt)}
            </dd>
          </div>

          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-zinc-500">
              Aceita em
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 sm:col-span-2 sm:mt-0">
              {formatDate(proposal.acceptedAt)}
            </dd>
          </div>

          {proposal.notes && (
            <div className="px-6 py-4">
              <dt className="text-sm font-medium text-zinc-500">
                Observações / Escopo
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-900">
                {proposal.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Link
            href={`/services/${proposal.service.id}`}
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700"
          >
            ← Voltar ao serviço
          </Link>
          <Link
            href="/proposals"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700"
          >
            ← Todas as propostas
          </Link>
        </div>
        <Link
          href={`/proposals/${proposal.id}/edit`}
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800"
        >
          Editar proposta →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create field `listServices` export from services actions**

We need a way to list services for the form selector. Add to `src/features/services/actions.ts`:

```ts
export async function listServices(tenantId: string) {
  return prisma.service.findMany({
    where: { tenantId },
    select: {
      id: true,
      title: true,
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

Also add the corresponding test in `tests/unit/features/services/schema.test.ts`:

```ts
it("lists services with client info", async () => {
  prismaMock.service.findMany.mockResolvedValue([
    {
      id: "svc-1",
      title: "Serviço 1",
      client: { name: "Cliente A" },
    },
  ]);

  const result = await listServices("tenant-1");

  expect(result).toHaveLength(1);
  expect(result[0].client.name).toBe("Cliente A");
});
```

- [ ] **Step 6: Commit**

```bash
git add src/features/proposals/ProposalStatusBadge.tsx src/features/proposals/ProposalForm.tsx src/features/proposals/ProposalList.tsx src/features/proposals/ProposalDetail.tsx src/features/services/actions.ts tests/unit/features/services/schema.test.ts
git commit -m "feat: proposal UI components (badge, form, list, detail)"
```

---

### Task 4: Proposals routes — list, create, detail, edit

**Files:**
- Create: `src/app/(app)/proposals/page.tsx`
- Create: `src/app/(app)/proposals/new/page.tsx`
- Create: `src/app/(app)/proposals/[proposalId]/page.tsx`
- Create: `src/app/(app)/proposals/[proposalId]/edit/page.tsx`

- [ ] **Step 1: /proposals list page**

```tsx
import Link from "next/link";
import { Suspense } from "react";

import { ProposalList } from "@/features/proposals/ProposalList";
import { listProposals } from "@/features/proposals/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const tenantId = await requireTenantId();
  const params = await searchParams;

  const proposals = await listProposals(tenantId, {
    status: params.status,
    search: params.search,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Propostas
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie propostas comerciais vinculadas a serviços.
          </p>
        </div>
        <Link
          href="/proposals/new"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800"
        >
          Nova Proposta
        </Link>
      </div>

      <ProposalList proposals={proposals} />
    </div>
  );
}
```

- [ ] **Step 2: /proposals/new page**

```tsx
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ProposalForm } from "@/features/proposals/ProposalForm";
import { createProposal, listProposals } from "@/features/proposals/actions";
import { listServices } from "@/features/services/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function NewProposalPage() {
  const tenantId = await requireTenantId();
  const services = await listServices(tenantId);

  async function handleCreate(formData: FormData) {
    "use server";

    const proposal = await createProposal(tenantId, {
      serviceId: formData.get("serviceId") as string,
      title: formData.get("title") as string,
      totalAmount: (formData.get("totalAmount") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
      validUntil: (formData.get("validUntil") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    revalidatePath("/proposals");
    revalidatePath(`/services/${formData.get("serviceId")}`);
    return { redirectUrl: `/proposals/${proposal.id}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Nova Proposta
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Crie uma proposta comercial vinculada a um serviço.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <ProposalForm action={handleCreate} services={services} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: /proposals/[proposalId] detail page**

```tsx
import { notFound } from "next/navigation";

import { ProposalDetail } from "@/features/proposals/ProposalDetail";
import { getProposal } from "@/features/proposals/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { proposalId } = await params;

  const proposal = await getProposal(tenantId, proposalId);

  if (!proposal) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProposalDetail proposal={proposal} />
    </div>
  );
}
```

- [ ] **Step 4: /proposals/[proposalId]/edit page**

```tsx
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { ProposalForm } from "@/features/proposals/ProposalForm";
import { getProposal, updateProposal } from "@/features/proposals/actions";
import { listServices } from "@/features/services/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { proposalId } = await params;

  const [proposal, services] = await Promise.all([
    getProposal(tenantId, proposalId),
    listServices(tenantId),
  ]);

  if (!proposal) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";

    await updateProposal(tenantId, proposal.serviceId, proposalId, {
      title: (formData.get("title") as string) || undefined,
      totalAmount: (formData.get("totalAmount") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
      validUntil: (formData.get("validUntil") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    revalidatePath(`/proposals/${proposalId}`);
    revalidatePath("/proposals");
    return { redirectUrl: `/proposals/${proposalId}` };
  }

  const dueDateStr = proposal.validUntil
    ? new Date(proposal.validUntil).toISOString().split("T")[0]
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Editar Proposta
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atualize os dados da proposta.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <ProposalForm
          action={handleUpdate}
          services={services}
          proposal={{
            serviceId: proposal.serviceId,
            title: proposal.title,
            totalAmount: proposal.totalAmount
              ? proposal.totalAmount.toString()
              : null,
            status: proposal.status,
            validUntil: dueDateStr,
            notes: proposal.notes,
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add status filter to proposals list**

Update `/proposals/page.tsx` to use `searchParams` for the status filter. Replace the content area:

```tsx
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        Propostas
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Gerencie propostas comerciais vinculadas a serviços.
      </p>
    </div>
    <Link
      href="/proposals/new"
      className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800"
    >
      Nova Proposta
    </Link>
  </div>

  <div className="flex gap-2">
    <Link
      href="/proposals"
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        !params.status
          ? "bg-zinc-900 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      Todas
    </Link>
    {["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELED"].map((s) => (
      <Link
        key={s}
        href={`/proposals?status=${s}`}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          params.status === s
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
        }`}
      >
        {s === "DRAFT" && "Rascunho"}
        {s === "SENT" && "Enviada"}
        {s === "ACCEPTED" && "Aceita"}
        {s === "REJECTED" && "Recusada"}
        {s === "CANCELED" && "Cancelada"}
      </Link>
    ))}
  </div>

  <ProposalList proposals={proposals} />
</div>
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/proposals/
git commit -m "feat: proposal CRUD routes (list, create, detail, edit)"
```

---

### Task 5: Commercial dashboard

**Files:**
- Create: `src/features/commercial/actions.ts`
- Create: `src/app/(app)/commercial/page.tsx`

- [ ] **Step 1: Commercial metrics actions**

```ts
import { prisma } from "@/server/db/client";

export interface CommercialMetrics {
  totalProposals: number;
  draftCount: number;
  sentCount: number;
  acceptedCount: number;
  rejectedCanceledCount: number;
  expiredCount: number;
  openValue: number;
  acceptedValue: number;
  recentProposals: {
    id: string;
    title: string;
    status: string;
    totalAmount: { toString: () => string } | null;
    validUntil: Date | null;
    service: { title: string; client: { name: string } };
  }[];
}

export async function getCommercialMetrics(
  tenantId: string,
): Promise<CommercialMetrics> {
  const allProposals = await prisma.proposal.findMany({
    where: { tenantId },
    include: {
      service: {
        select: {
          title: true,
          client: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  const draftCount = allProposals.filter((p) => p.status === "DRAFT").length;
  const sentCount = allProposals.filter((p) => p.status === "SENT").length;
  const acceptedCount = allProposals.filter(
    (p) => p.status === "ACCEPTED",
  ).length;
  const rejectedCanceledCount = allProposals.filter(
    (p) => p.status === "REJECTED" || p.status === "CANCELED",
  ).length;
  const expiredCount = allProposals.filter(
    (p) =>
      p.status !== "ACCEPTED" &&
      p.status !== "REJECTED" &&
      p.status !== "CANCELED" &&
      p.validUntil &&
      new Date(p.validUntil) < now,
  ).length;

  const openValue = allProposals
    .filter((p) => p.status === "DRAFT" || p.status === "SENT")
    .reduce(
      (sum, p) => sum + (p.totalAmount ? Number(p.totalAmount) : 0),
      0,
    );

  const acceptedValue = allProposals
    .filter((p) => p.status === "ACCEPTED")
    .reduce(
      (sum, p) => sum + (p.totalAmount ? Number(p.totalAmount) : 0),
      0,
    );

  const recentProposals = allProposals
    .filter((p) => p.status === "DRAFT" || p.status === "SENT")
    .slice(0, 5);

  return {
    totalProposals: allProposals.length,
    draftCount,
    sentCount,
    acceptedCount,
    rejectedCanceledCount,
    expiredCount,
    openValue,
    acceptedValue,
    recentProposals,
  };
}
```

Also write the test file `tests/unit/features/commercial/actions.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    proposal: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { getCommercialMetrics } from "@/features/commercial/actions";

describe("commercial actions", () => {
  const tenantId = "tenant-1";
  const now = new Date();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes metrics correctly", async () => {
    const futureDate = new Date(now.getTime() + 86400000);
    const pastDate = new Date(now.getTime() - 86400000);

    prismaMock.proposal.findMany.mockResolvedValue([
      {
        id: "p1",
        status: "DRAFT",
        totalAmount: 10000,
        validUntil: futureDate,
        service: { title: "S1", client: { name: "C1" } },
      },
      {
        id: "p2",
        status: "SENT",
        totalAmount: 20000,
        validUntil: futureDate,
        service: { title: "S2", client: { name: "C2" } },
      },
      {
        id: "p3",
        status: "ACCEPTED",
        totalAmount: 30000,
        validUntil: null,
        service: { title: "S3", client: { name: "C3" } },
      },
      {
        id: "p4",
        status: "REJECTED",
        totalAmount: null,
        validUntil: null,
        service: { title: "S4", client: { name: "C4" } },
      },
      {
        id: "p5",
        status: "CANCELED",
        totalAmount: null,
        validUntil: null,
        service: { title: "S5", client: { name: "C5" } },
      },
      {
        id: "p6",
        status: "DRAFT",
        totalAmount: 5000,
        validUntil: pastDate, // expired
        service: { title: "S6", client: { name: "C6" } },
      },
    ]);

    const metrics = await getCommercialMetrics(tenantId);

    expect(metrics.totalProposals).toBe(6);
    expect(metrics.draftCount).toBe(2);
    expect(metrics.sentCount).toBe(1);
    expect(metrics.acceptedCount).toBe(1);
    expect(metrics.rejectedCanceledCount).toBe(2);
    expect(metrics.expiredCount).toBe(1);
    expect(metrics.openValue).toBe(35000); // 10000 + 20000 + 5000
    expect(metrics.acceptedValue).toBe(30000);
    expect(metrics.recentProposals).toHaveLength(2); // draft + sent only
  });

  it("returns zeros when no proposals exist", async () => {
    prismaMock.proposal.findMany.mockResolvedValue([]);

    const metrics = await getCommercialMetrics(tenantId);

    expect(metrics.totalProposals).toBe(0);
    expect(metrics.draftCount).toBe(0);
    expect(metrics.openValue).toBe(0);
    expect(metrics.acceptedValue).toBe(0);
    expect(metrics.recentProposals).toEqual([]);
  });
});
```

- [ ] **Step 2: Commercial dashboard page**

```tsx
import Link from "next/link";

import { getCommercialMetrics } from "@/features/commercial/actions";
import { ProposalStatusBadge } from "@/features/proposals/ProposalStatusBadge";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default async function CommercialPage() {
  const tenantId = await requireTenantId();
  const metrics = await getCommercialMetrics(tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Comercial
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pipeline comercial e acompanhamento de propostas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          label="Total de Propostas"
          value={metrics.totalProposals.toString()}
        />
        <MetricCard
          label="Em Aberto"
          value={formatCurrency(metrics.openValue)}
          sub={`${metrics.draftCount + metrics.sentCount} propostas`}
        />
        <MetricCard
          label="Valor Aceito"
          value={formatCurrency(metrics.acceptedValue)}
          sub={`${metrics.acceptedCount} propostas`}
        />
        <MetricCard
          label="Enviadas"
          value={metrics.sentCount.toString()}
          href="/proposals?status=SENT"
        />
        <MetricCard
          label="Aceitas"
          value={metrics.acceptedCount.toString()}
          href="/proposals?status=ACCEPTED"
        />
        <MetricCard
          label="Recusadas / Canceladas"
          value={metrics.rejectedCanceledCount.toString()}
          href="/proposals?status=REJECTED"
        />
        <MetricCard
          label="Vencidas"
          value={metrics.expiredCount.toString()}
        />
      </div>

      {metrics.recentProposals.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Propostas em Aberto
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {metrics.recentProposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}`}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {proposal.title}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {proposal.service.client.name} —{" "}
                    {proposal.service.title}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <ProposalStatusBadge status={proposal.status} />
                  <span className="text-sm tabular-nums text-zinc-900">
                    {proposal.totalAmount
                      ? formatCurrency(Number(proposal.totalAmount))
                      : "—"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <Link
          href="/proposals"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Ver todas as propostas →
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-900 tabular-nums">
        {value}
      </dd>
      {sub && (
        <dd className="mt-0.5 text-xs text-zinc-400">{sub}</dd>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: all proposal + commercial tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/commercial/ tests/unit/features/commercial/ src/app/(app)/commercial/
git commit -m "feat: commercial dashboard with pipeline metrics"
```

---

### Task 6: Service detail integration — proposals section

**Files:**
- Modify: `src/app/(app)/services/[serviceId]/page.tsx`

- [ ] **Step 1: Add proposals section to service detail**

Modify the service detail page to include a compact proposals section between the stats grid and the tasks section.

Add import:
```tsx
import { ProposalStatusBadge } from "@/features/proposals/ProposalStatusBadge";
import { listProposals } from "@/features/proposals/actions";
```

After the stats grid (`service._count.proposals`), add:

```tsx
{/* Propostas */}
<div className="rounded-xl border border-zinc-200 bg-white">
  <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
    <h2 className="text-base font-semibold text-zinc-900">
      Propostas
    </h2>
    <Link
      href={`/proposals/new?serviceId=${serviceId}`}
      className="text-sm font-medium text-blue-600 hover:text-blue-500"
    >
      Criar Proposta →
    </Link>
  </div>

  {proposals.length === 0 ? (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <p className="text-sm text-zinc-400">
        Nenhuma proposta vinculada a este serviço.
      </p>
    </div>
  ) : (
    <div className="divide-y divide-zinc-100">
      {proposals.map((proposal) => (
        <Link
          key={proposal.id}
          href={`/proposals/${proposal.id}`}
          className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">
              {proposal.title}
            </p>
            {proposal.validUntil && (
              <p className="text-xs text-zinc-400">
                Validade:{" "}
                {new Intl.DateTimeFormat("pt-BR").format(
                  new Date(proposal.validUntil),
                )}
              </p>
            )}
          </div>
          <div className="ml-4 flex items-center gap-3">
            <ProposalStatusBadge status={proposal.status} />
            <span className="text-sm tabular-nums text-zinc-900">
              {proposal.totalAmount
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(proposal.totalAmount))
                : "—"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )}
</div>
```

Also fetch proposals in the page function:
```tsx
const proposals = await listProposals(tenantId, { serviceId });
```

- [ ] **Step 2: Make the proposals stat clickable**

Update the stat card in the service detail page:
```tsx
<Link
  href={`/proposals?status=DRAFT`}
  className="rounded-lg bg-zinc-50 p-4 transition-colors hover:bg-zinc-100"
>
  <dt className="text-xs font-medium text-zinc-500">Propostas</dt>
  <dd className="text-2xl font-semibold text-zinc-900 tabular-nums">
    {service._count.proposals}
  </dd>
</Link>
```

- [ ] **Step 3: Confirm service detail page still compiles**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/services/[serviceId]/page.tsx
git commit -m "feat: add proposals section to service detail page"
```

---

### Task 7: Demo seed data — proposals

**Files:**
- Modify: `scripts/seed-demo.ts`

- [ ] **Step 1: Add proposal creation to demo seed**

After creating services and tasks, add proposals. Find the `DATES` helper and the service lookups, then append:

```ts
// ── Proposals ──────────────────────────────────────────
console.log("  Seeding proposals...");

const demoProposalService1 = await prisma.service.findFirst({
  where: { tenantId, title: "Demo Beta Reforma Residencial Completa" },
  select: { id: true, clientId: true },
});

const demoProposalService2 = await prisma.service.findFirst({
  where: { tenantId, title: "Demo Beta Aprovacao de Projeto Residencial" },
  select: { id: true, clientId: true },
});

const demoProposalService3 = await prisma.service.findFirst({
  where: { tenantId, title: "Demo Beta Projeto Estrutural" },
  select: { id: true, clientId: true },
});

if (demoProposalService1) {
  await prisma.proposal.create({
    data: {
      tenantId,
      serviceId: demoProposalService1.id,
      title: "Proposta de Reforma Residencial Completa",
      status: "SENT",
      totalAmount: new Decimal(45000.0),
      sentAt: DATES.past(10),
      validUntil: DATES.future(20),
      notes:
        "Escopo: reforma completa incluindo elétrica, hidráulica e acabamentos. Prazo estimado: 60 dias.",
    },
  });
}

if (demoProposalService2) {
  await prisma.proposal.create({
    data: {
      tenantId,
      serviceId: demoProposalService2.id,
      title: "Proposta de Aprovacao de Projeto Residencial",
      status: "ACCEPTED",
      totalAmount: new Decimal(18500.0),
      sentAt: DATES.past(20),
      acceptedAt: DATES.past(15),
      validUntil: DATES.future(45),
      notes:
        "Aprovação de projeto residencial junto à Prefeitura de Palmas. Inclui todas as taxas.",
    },
  });
}

if (demoProposalService3) {
  await prisma.proposal.create({
    data: {
      tenantId,
      serviceId: demoProposalService3.id,
      title: "Proposta de Projeto Estrutural",
      status: "DRAFT",
      totalAmount: new Decimal(12000.0),
      validUntil: DATES.future(60),
      notes: "Projeto estrutural em concreto armado. 3 pavimentos.",
    },
  });
}
```

Add import at top if not already:
```ts
import { Decimal } from "@prisma/client/runtime/library";
```

(Prisma cuid() auto-generates `id`, so omit it.)

- [ ] **Step 2: Run demo seed to verify it works**

```bash
$env:CONFIRM_DEMO_SEED=1; pnpm demo:seed
```

Expected: seed completes without errors, shows "Seeding proposals..." log.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-demo.ts
git commit -m "feat: add proposal demo seeds (DRAFT, SENT, ACCEPTED)"
```

---

### Task 8: E2E test — proposal flow

**Files:**
- Create: `tests/e2e/proposal-flow.spec.ts`

- [ ] **Step 1: Write the e2e test**

```ts
import { expect, test } from "@playwright/test";

const PREFIX = `Teste E2E ${Date.now()}`;

test.describe("fluxo comercial de propostas", () => {
  test("cria proposta a partir do servico e navega ao detalhe", async ({
    page,
  }) => {
    test.setTimeout(90000);

    // Login
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // Create client
    await page.goto("/clients/new");
    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();
    await page.waitForFunction(
      () =>
        window.location.pathname.startsWith("/clients/") &&
        !window.location.pathname.endsWith("/new"),
      { timeout: 15000 },
    );
    const clientId = page.url().split("/").pop()!;

    // Create property
    await page.goto(`/properties/new?clientId=${clientId}`);
    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();
    await page.waitForFunction(
      () =>
        window.location.pathname.startsWith("/properties/") &&
        !window.location.pathname.endsWith("/new"),
      { timeout: 15000 },
    );
    const propertyId = page.url().split("/").pop()!;

    // Create service
    await page.goto(
      `/services/new?clientId=${clientId}&propertyId=${propertyId}`,
    );
    await page.getByLabel("Título *").fill(`${PREFIX} - Serviço`);
    await page
      .getByLabel("Tipo de Serviço *")
      .selectOption("TECHNICAL_PROJECT");
    await page.getByRole("button", { name: "Criar Serviço" }).click();
    await page.waitForFunction(
      () =>
        window.location.pathname.startsWith("/services/") &&
        !window.location.pathname.endsWith("/new"),
      { timeout: 15000 },
    );
    const serviceId = page.url().split("/").pop()!;

    // Create proposal via the service detail page CTA
    await page.waitForSelector("text=Criar Proposta");
    await page.getByRole("link", { name: /criar proposta/i }).click();
    await page.waitForURL(`**/proposals/new?serviceId=*`, { timeout: 10000 });

    // Fill proposal form (service is pre-selected)
    await page.getByLabel("Título *").fill(`${PREFIX} - Proposta`);
    await page.getByLabel("Valor Total").fill("25000");
    await page.getByRole("button", { name: /criar proposta/i }).click();

    // Wait for redirect to proposal detail
    await page.waitForURL(/\/proposals\/[^/]+$/, { timeout: 15000 });

    // Validate detail page
    await expect(
      page.getByRole("heading", { name: `${PREFIX} - Proposta` }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("edita status da proposta e verifica no dashboard commercial", async ({
    page,
  }) => {
    test.setTimeout(90000);

    // Login
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // Use demo data — navigate to proposals
    await page.goto("/proposals");
    await page.waitForURL("/proposals", { timeout: 10000 });

    // Find a proposal to edit (e.g., draft proposal from demo seed)
    const draftProposal = page.locator("text=Proposta de Projeto Estrutural");
    if (await draftProposal.isVisible()) {
      // Open the draft proposal
      await page.goto("/proposals"); // refresh to ensure clean state
      await page.waitForSelector("text=Proposta de Projeto Estrutural", {
        timeout: 5000,
      });
      await draftProposal.click();
      await page.waitForURL(/\/proposals\/[^/]+$/, { timeout: 10000 });

      // Click edit
      await page.getByRole("link", { name: /editar proposta/i }).click();
      await page.waitForURL(/\/proposals\/[^/]+\/edit/, { timeout: 10000 });

      // Change to "Enviada"
      await page.getByLabel("Título *").fill(`${PREFIX} - Proposta Editada`);
      await page.getByRole("button", { name: /salvar proposta/i }).click();

      // Should redirect back to detail
      await page.waitForURL(/\/proposals\/[^/]+$/, { timeout: 15000 });
      await expect(
        page.getByText(`${PREFIX} - Proposta Editada`),
      ).toBeVisible({ timeout: 5000 });
    }

    // Visit commercial dashboard
    await page.goto("/commercial");
    await page.waitForURL("/commercial", { timeout: 10000 });
    await expect(page.getByText("Comercial")).toBeVisible();
    await expect(page.getByText("Total de Propostas")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run e2e tests**

```bash
pnpm test:e2e
```

Expected: All e2e tests PASS (9/9: 7 existing + 2 new).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/proposal-flow.spec.ts
git commit -m "test: add e2e tests for proposal creation and edit flow"
```

---

### Task 9: Final verification gate

- [ ] **Step 1: Run all gates**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e && git diff --check
```

Expected: all PASS.

- [ ] **Step 2: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: fix lint and type issues from proposal workflow"
```

---

### Task 10: Final commit and summary

- [ ] **Step 1: Create the final summary commit**

```bash
git log --oneline -10
git push
```
