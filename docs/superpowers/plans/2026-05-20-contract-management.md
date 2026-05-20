# Contract Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete contract CRUD workflow — list, create, view, edit contracts, with sidebar link and service/proposal integrations.

**Architecture:** New `contracts/` feature module following `proposals/` pattern exactly (Zod schemas, Server Actions, `useActionState` forms, tenant-scoped Prisma). No migration needed — `Contract` model already exists.

**Tech Stack:** Next.js 16 App Router, Prisma, Zod, TailwindCSS

---

### Task 1: Contract actions — Zod schemas + CRUD

**Files:**
- Create: `src/features/contracts/actions.ts`

- [ ] **Step 1: Write the failing test**

File: `tests/unit/features/contracts/schema.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  createContractSchema,
  updateContractSchema,
  CONTRACT_STATUSES,
} from "@/features/contracts/actions";

describe("contract action schema validation", () => {
  it("validates createContract input with required fields", () => {
    const result = createContractSchema.parse({
      serviceId: "svc-1",
      title: "Contrato de Reforma",
    });
    expect(result.serviceId).toBe("svc-1");
    expect(result.title).toBe("Contrato de Reforma");
    expect(result.status).toBeUndefined();
  });

  it("rejects empty title", () => {
    expect(() =>
      createContractSchema.parse({ serviceId: "svc-1", title: "" }),
    ).toThrow();
  });

  it("accepts optional proposalId", () => {
    const result = createContractSchema.parse({
      serviceId: "svc-1",
      title: "Contrato",
      proposalId: "prop-1",
    });
    expect(result.proposalId).toBe("prop-1");
  });

  it("accepts all valid statuses", () => {
    for (const s of CONTRACT_STATUSES) {
      const result = createContractSchema.parse({
        serviceId: "svc-1",
        title: "Teste",
        status: s,
      });
      expect(result.status).toBe(s);
    }
  });

  it("rejects invalid status", () => {
    expect(() =>
      createContractSchema.parse({
        serviceId: "svc-1",
        title: "Teste",
        status: "INVALID",
      }),
    ).toThrow();
  });

  it("validates updateContract with partial fields", () => {
    const result = updateContractSchema.parse({ title: "Novo titulo" });
    expect(result.title).toBe("Novo titulo");
    expect(result.status).toBeUndefined();
  });

  it("rejects number change in update", () => {
    expect(() =>
      updateContractSchema.parse({ number: "CT-99999" }),
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

File: `src/features/contracts/actions.ts`

```ts
import { z } from "zod";

import { prisma } from "@/server/db/client";

export const CONTRACT_STATUSES = [
  "DRAFT",
  "ISSUED",
  "SIGNED",
  "COMPLETED",
  "CANCELLED",
] as const;

const createContractSchema = z.object({
  serviceId: z.string().min(1),
  proposalId: z.string().optional(),
  title: z.string().min(1),
  status: z.enum(CONTRACT_STATUSES).optional(),
});

const updateContractSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
});

export type CreateContractInput = z.input<typeof createContractSchema>;
export type UpdateContractInput = z.input<typeof updateContractSchema>;

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

async function assertContractBelongsToTenant(
  tenantId: string,
  contractId: string,
): Promise<{ status: string; signedAt: Date | null }> {
  const contract = await prisma.contract.findFirst({
    where: { tenantId, id: contractId },
    select: { status: true, signedAt: true },
  });
  if (!contract) {
    throw new Error(
      `Contract ${contractId} does not belong to tenant ${tenantId}`,
    );
  }
  return contract;
}

function computeStatusTimestamps(
  status: string | undefined,
  current: { signedAt: Date | null },
): Record<string, unknown> {
  const timestamps: Record<string, unknown> = {};
  if (!status) return timestamps;

  if (status === "SIGNED" && !current.signedAt) {
    timestamps.signedAt = new Date();
  }
  if (status !== "SIGNED" && current.signedAt) {
    timestamps.signedAt = null;
  }
  return timestamps;
}

export async function generateContractNumber(tenantId: string): Promise<string> {
  const count = await prisma.contract.count({ where: { tenantId } });
  const seq = (count + 1).toString().padStart(5, "0");
  return `CT-${seq}`;
}

export async function createContract(tenantId: string, input: CreateContractInput) {
  const data = createContractSchema.parse(input);

  await assertServiceBelongsToTenant(tenantId, data.serviceId);

  if (data.proposalId) {
    await assertProposalBelongsToService(tenantId, data.serviceId, data.proposalId);
  }

  const number = await generateContractNumber(tenantId);

  return prisma.contract.create({
    data: {
      tenantId,
      serviceId: data.serviceId,
      proposalId: data.proposalId ?? null,
      number,
      title: data.title,
      status: data.status ?? "DRAFT",
    },
  });
}

export async function updateContract(
  tenantId: string,
  contractId: string,
  input: UpdateContractInput,
) {
  const data = updateContractSchema.parse(input);
  const current = await assertContractBelongsToTenant(tenantId, contractId);
  const timestamps = computeStatusTimestamps(data.status, current);

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.status !== undefined) updateData.status = data.status;
  Object.assign(updateData, timestamps);

  return prisma.contract.update({
    where: { tenantId_id: { tenantId, id: contractId } },
    data: updateData,
  });
}

export async function listContracts(
  tenantId: string,
  options?: { serviceId?: string; proposalId?: string; status?: string; search?: string },
) {
  const where: Record<string, unknown> = { tenantId };
  if (options?.serviceId) where.serviceId = options.serviceId;
  if (options?.proposalId) where.proposalId = options.proposalId;
  if (options?.status) where.status = options.status;
  if (options?.search) {
    where.title = { contains: options.search, mode: "insensitive" };
  }

  return prisma.contract.findMany({
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
      proposal: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getContract(tenantId: string, contractId: string) {
  return prisma.contract.findFirst({
    where: { tenantId, id: contractId },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          client: { select: { id: true, name: true } },
          property: { select: { id: true, name: true } },
        },
      },
      proposal: {
        select: { id: true, title: true },
      },
    },
  });
}

export { createContractSchema, updateContractSchema };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test
```

Expected: all schema tests PASS.

- [ ] **Step 5: Write the actions test**

File: `tests/unit/features/contracts/actions.test.ts`

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    contract: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    service: { findUnique: vi.fn() },
    proposal: { findFirst: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import {
  createContract,
  generateContractNumber,
  getContract,
  listContracts,
  updateContract,
} from "@/features/contracts/actions";

describe("contract actions", () => {
  const tenantId = "tenant-1";
  const now = new Date();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates sequential contract numbers", async () => {
    prismaMock.contract.count.mockResolvedValue(0);
    expect(await generateContractNumber(tenantId)).toBe("CT-00001");

    prismaMock.contract.count.mockResolvedValue(12);
    expect(await generateContractNumber(tenantId)).toBe("CT-00013");

    prismaMock.contract.count.mockResolvedValue(999);
    expect(await generateContractNumber(tenantId)).toBe("CT-01000");
  });

  it("creates a contract with auto-generated number", async () => {
    prismaMock.contract.count.mockResolvedValue(0);
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    prismaMock.contract.create.mockResolvedValue({
      id: "ct-1",
      tenantId,
      serviceId: "svc-1",
      proposalId: null,
      number: "CT-00001",
      title: "Contrato Teste",
      status: "DRAFT",
      signedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const result = await createContract(tenantId, {
      serviceId: "svc-1",
      title: "Contrato Teste",
    });

    expect(result.number).toBe("CT-00001");
    expect(result.title).toBe("Contrato Teste");
  });

  it("rejects create when service does not belong to tenant", async () => {
    prismaMock.contract.count.mockResolvedValue(0);
    prismaMock.service.findUnique.mockResolvedValue(null);

    await expect(
      createContract(tenantId, { serviceId: "svc-1", title: "Teste" }),
    ).rejects.toThrow("Service svc-1 does not belong to tenant tenant-1");
    expect(prismaMock.contract.create).not.toHaveBeenCalled();
  });

  it("validates proposalId on create", async () => {
    prismaMock.contract.count.mockResolvedValue(1);
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    prismaMock.proposal.findFirst.mockResolvedValue(null);

    await expect(
      createContract(tenantId, {
        serviceId: "svc-1",
        title: "Teste",
        proposalId: "prop-1",
      }),
    ).rejects.toThrow("Proposal prop-1 does not belong to service");
  });

  it("lists contracts with service and proposal includes", async () => {
    prismaMock.contract.findMany.mockResolvedValue([
      {
        id: "ct-1",
        tenantId,
        serviceId: "svc-1",
        proposalId: "prop-1",
        number: "CT-00001",
        title: "Contrato 1",
        status: "DRAFT",
        signedAt: null,
        createdAt: now,
        updatedAt: now,
        service: {
          id: "svc-1",
          title: "Servico 1",
          client: { id: "cli-1", name: "Cliente 1" },
          property: null,
        },
        proposal: { id: "prop-1", title: "Proposta 1" },
      },
    ]);

    const result = await listContracts(tenantId);
    expect(result).toHaveLength(1);
    expect(result[0].service.client.name).toBe("Cliente 1");
    expect(result[0].proposal?.title).toBe("Proposta 1");
  });

  it("gets a single contract by id", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({
      id: "ct-1",
      tenantId,
      serviceId: "svc-1",
      proposalId: null,
      number: "CT-00001",
      title: "Contrato 1",
      status: "DRAFT",
      signedAt: null,
      createdAt: now,
      updatedAt: now,
      service: {
        id: "svc-1",
        title: "Servico 1",
        client: { id: "cli-1", name: "Cliente 1" },
        property: { id: "prop-1", name: "Imovel 1" },
      },
      proposal: null,
    });

    const result = await getContract(tenantId, "ct-1");
    expect(result?.id).toBe("ct-1");
    expect(result?.number).toBe("CT-00001");
  });

  it("returns null for non-existent contract", async () => {
    prismaMock.contract.findFirst.mockResolvedValue(null);
    const result = await getContract(tenantId, "nonexistent");
    expect(result).toBeNull();
  });

  it("sets signedAt when status becomes SIGNED", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({
      id: "ct-1",
      tenantId,
      status: "DRAFT",
      signedAt: null,
    });
    prismaMock.contract.update.mockResolvedValue({
      id: "ct-1",
      tenantId,
      serviceId: "svc-1",
      proposalId: null,
      number: "CT-00001",
      title: "Contrato",
      status: "SIGNED",
      signedAt: new Date(),
      createdAt: now,
      updatedAt: now,
    });

    const result = await updateContract(tenantId, "ct-1", {
      title: "Contrato",
      status: "SIGNED",
    });

    expect(result.status).toBe("SIGNED");
    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId, id: "ct-1" } },
      data: expect.objectContaining({
        status: "SIGNED",
        signedAt: expect.any(Date),
      }),
    });
  });

  it("clears signedAt when status leaves SIGNED", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({
      id: "ct-1",
      tenantId,
      status: "SIGNED",
      signedAt: new Date(),
    });
    prismaMock.contract.update.mockResolvedValue({
      id: "ct-1",
      tenantId,
      serviceId: "svc-1",
      proposalId: null,
      number: "CT-00001",
      title: "Contrato",
      status: "DRAFT",
      signedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await updateContract(tenantId, "ct-1", { status: "DRAFT" });

    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId, id: "ct-1" } },
      data: expect.objectContaining({
        status: "DRAFT",
        signedAt: null,
      }),
    });
  });

  it("rejects update when contract does not belong to tenant", async () => {
    prismaMock.contract.findFirst.mockResolvedValue(null);

    await expect(
      updateContract(tenantId, "ct-1", { title: "Novo" }),
    ).rejects.toThrow("Contract ct-1 does not belong to tenant tenant-1");
    expect(prismaMock.contract.update).not.toHaveBeenCalled();
  });

  it("filters contracts by serviceId", async () => {
    prismaMock.contract.findMany.mockResolvedValue([]);

    const result = await listContracts(tenantId, { serviceId: "svc-1" });

    expect(result).toEqual([]);
    expect(prismaMock.contract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          serviceId: "svc-1",
        }),
      }),
    );
  });

  it("filters contracts by proposalId", async () => {
    prismaMock.contract.findMany.mockResolvedValue([]);

    const result = await listContracts(tenantId, { proposalId: "prop-1" });

    expect(result).toEqual([]);
    expect(prismaMock.contract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          proposalId: "prop-1",
        }),
      }),
    );
  });
});
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pnpm test
```

Expected: all contract tests PASS (schema + actions).

- [ ] **Step 7: Commit**

```bash
git add src/features/contracts/actions.ts tests/unit/features/contracts/
git commit -m "feat: contract CRUD actions with Zod validation, auto-numbering, and status transitions"
```

---

### Task 2: Contract components — StatusBadge, Form, List, Detail

**Files:**
- Create: `src/features/contracts/ContractStatusBadge.tsx`
- Create: `src/features/contracts/ContractForm.tsx`
- Create: `src/features/contracts/ContractList.tsx`
- Create: `src/features/contracts/ContractDetail.tsx`

- [ ] **Step 1: ContractStatusBadge**

```tsx
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
```

- [ ] **Step 2: ContractForm**

```tsx
"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ContractFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  services: { id: string; title: string; client: { name: string } }[];
  contract?: {
    serviceId: string;
    proposalId?: string | null;
    title: string;
    status: string;
  };
}

export function ContractForm({ action, services, contract }: ContractFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("serviceId");
  const preselectedProposalId = searchParams.get("proposalId");

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

  const isEdit = !!contract;
  const hasFixedService = isEdit || preselectedServiceId;
  const fixedService = hasFixedService
    ? services.find(
        (s) => s.id === (contract?.serviceId ?? preselectedServiceId),
      )
    : null;

  return (
    <form action={formAction} className="space-y-5">
      {hasFixedService ? (
        <>
          <input
            type="hidden"
            name="serviceId"
            value={contract?.serviceId ?? preselectedServiceId ?? ""}
          />
          {preselectedProposalId && !isEdit && (
            <input
              type="hidden"
              name="proposalId"
              value={preselectedProposalId}
            />
          )}
        </>
      ) : null}

      <Field label="Serviço" id="serviceId">
        {hasFixedService ? (
          <input
            id="serviceId"
            readOnly
            value={
              fixedService
                ? `${fixedService.title} — ${fixedService.client.name}`
                : "Carregando..."
            }
            className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
          />
        ) : (
          <select
            id="serviceId"
            name="serviceId"
            required
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">Selecione um serviço</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title} — {service.client.name}
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
          defaultValue={contract?.title ?? ""}
          placeholder="Ex: Contrato de Execução de Obra"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      {!isEdit && !preselectedProposalId && (
        <Field label="Proposta (opcional)" id="proposalId">
          <select
            id="proposalId"
            name="proposalId"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">Nenhuma</option>
          </select>
        </Field>
      )}

      <Field label="Status" id="status">
        <select
          id="status"
          name="status"
          defaultValue={contract?.status ?? "DRAFT"}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          <option value="DRAFT">Rascunho</option>
          <option value="ISSUED">Emitido</option>
          <option value="SIGNED">Assinado</option>
          <option value="COMPLETED">Concluído</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Salvando..." : isEdit ? "Salvar Contrato" : "Criar Contrato"}
      </button>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: ContractList**

```tsx
import Link from "next/link";
import { ContractStatusBadge } from "./ContractStatusBadge";
import type { listContracts } from "./actions";

interface ContractListProps {
  contracts: Awaited<ReturnType<typeof listContracts>>;
}

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function ContractList({ contracts }: ContractListProps) {
  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-16 text-center">
        <svg className="mb-3 h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <p className="text-sm text-zinc-400">Nenhum contrato encontrado.</p>
        <Link
          href="/contracts/new"
          className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Criar Contrato
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead>
          <tr className="border-b border-zinc-100">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Nº</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Título</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Cliente</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Serviço</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Assinatura</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {contracts.map((contract) => (
            <tr key={contract.id} className="hover:bg-zinc-50 transition-colors">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-mono font-medium text-zinc-900">
                {contract.number}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                {contract.title}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {contract.service.client.name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {contract.service.title}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <ContractStatusBadge status={contract.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {formatDate(contract.signedAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                <Link
                  href={`/contracts/${contract.id}`}
                  className="font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
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

- [ ] **Step 4: ContractDetail**

```tsx
import Link from "next/link";
import { ContractStatusBadge } from "./ContractStatusBadge";
import type { getContract } from "./actions";

interface ContractDetailProps {
  contract: NonNullable<Awaited<ReturnType<typeof getContract>>>;
}

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function ContractDetail({ contract }: ContractDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {contract.title}
          </h1>
          <ContractStatusBadge status={contract.status} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">Informações</h2>
        <dl className="divide-y divide-zinc-100">
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Nº do Contrato</dt>
            <dd className="text-sm font-mono font-medium text-zinc-900">{contract.number}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Cliente</dt>
            <dd className="text-sm text-zinc-900">
              <Link
                href={`/clients/${contract.service.client.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {contract.service.client.name}
              </Link>
            </dd>
          </div>
          {contract.service.property && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Imóvel</dt>
              <dd className="text-sm text-zinc-900">
                <Link
                  href={`/properties/${contract.service.property.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {contract.service.property.name}
                </Link>
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Serviço</dt>
            <dd className="text-sm text-zinc-900">
              <Link
                href={`/services/${contract.service.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {contract.service.title}
              </Link>
            </dd>
          </div>
          {contract.proposal && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Proposta</dt>
              <dd className="text-sm text-zinc-900">
                <Link
                  href={`/proposals/${contract.proposal.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {contract.proposal.title}
                </Link>
              </dd>
            </div>
          )}
          {contract.signedAt && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Assinado em</dt>
              <dd className="text-sm text-zinc-900">{formatDate(contract.signedAt)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Criado em</dt>
            <dd className="text-sm text-zinc-900">{formatDate(contract.createdAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/services/${contract.service.id}`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            ← Voltar ao serviço
          </Link>
          <Link
            href="/contracts"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            ← Todos os contratos
          </Link>
        </div>
        <Link
          href={`/contracts/${contract.id}/edit`}
          className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Editar contrato →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `listServices` export from services actions (if doesn't exist)**

The proposals block may have already added `listServices` to `src/features/services/actions.ts`. If not, add it:

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

- [ ] **Step 6: Commit**

```bash
git add src/features/contracts/ContractStatusBadge.tsx src/features/contracts/ContractForm.tsx src/features/contracts/ContractList.tsx src/features/contracts/ContractDetail.tsx
git commit -m "feat: contract UI components (badge, form, list, detail)"
```

---

### Task 3: Contract routes — list, create, detail, edit

**Files:**
- Create: `src/app/(app)/contracts/page.tsx`
- Create: `src/app/(app)/contracts/new/page.tsx`
- Create: `src/app/(app)/contracts/[contractId]/page.tsx`
- Create: `src/app/(app)/contracts/[contractId]/edit/page.tsx`

- [ ] **Step 1: /contracts list page**

```tsx
import Link from "next/link";

import { ContractList } from "@/features/contracts/ContractList";
import { listContracts } from "@/features/contracts/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "ISSUED", label: "Emitido" },
  { value: "SIGNED", label: "Assinado" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const tenantId = await requireTenantId();
  const params = await searchParams;

  const contracts = await listContracts(tenantId, {
    status: params.status || undefined,
    search: params.search || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Contratos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie contratos vinculados a serviços.
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800"
        >
          Novo Contrato
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => {
          const href = value ? `/contracts?status=${value}` : "/contracts";
          const isActive = value ? params.status === value : !params.status;
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <ContractList contracts={contracts} />
    </div>
  );
}
```

- [ ] **Step 2: /contracts/new page**

```tsx
import { revalidatePath } from "next/cache";

import { ContractForm } from "@/features/contracts/ContractForm";
import { createContract } from "@/features/contracts/actions";
import { listServices } from "@/features/services/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  const tenantId = await requireTenantId();
  const services = await listServices(tenantId);

  async function handleCreate(formData: FormData) {
    "use server";

    const proposalId = (formData.get("proposalId") as string) || undefined;

    const contract = await createContract(tenantId, {
      serviceId: formData.get("serviceId") as string,
      title: formData.get("title") as string,
      status: (formData.get("status") as string) || undefined,
      proposalId: proposalId || undefined,
    });

    revalidatePath("/contracts");
    revalidatePath(`/services/${formData.get("serviceId")}`);
    return { redirectUrl: `/contracts/${contract.id}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Novo Contrato
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Crie um contrato vinculado a um serviço.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <ContractForm action={handleCreate} services={services} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: /contracts/[contractId] detail page**

```tsx
import { notFound } from "next/navigation";

import { ContractDetail } from "@/features/contracts/ContractDetail";
import { getContract } from "@/features/contracts/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { contractId } = await params;

  const contract = await getContract(tenantId, contractId);

  if (!contract) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ContractDetail contract={contract} />
    </div>
  );
}
```

- [ ] **Step 4: /contracts/[contractId]/edit page**

```tsx
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { ContractForm } from "@/features/contracts/ContractForm";
import { getContract, updateContract } from "@/features/contracts/actions";
import { listServices } from "@/features/services/actions";
import { requireTenantId } from "@/server/auth/tenant";

export const dynamic = "force-dynamic";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { contractId } = await params;

  const [contract, services] = await Promise.all([
    getContract(tenantId, contractId),
    listServices(tenantId),
  ]);

  if (!contract) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";

    await updateContract(tenantId, contractId, {
      title: (formData.get("title") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
    });

    revalidatePath(`/contracts/${contractId}`);
    revalidatePath("/contracts");
    return { redirectUrl: `/contracts/${contractId}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Editar Contrato
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atualize os dados do contrato.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <ContractForm
          action={handleUpdate}
          services={services}
          contract={{
            serviceId: contract.serviceId,
            title: contract.title,
            status: contract.status,
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/contracts/
git commit -m "feat: contract CRUD routes (list, create, detail, edit)"
```

---

### Task 4: Sidebar + Service detail + Proposal detail integrations

**Files:**
- Modify: `src/components/app-shell/SidebarNav.tsx`
- Modify: `src/app/(app)/services/[serviceId]/page.tsx`
- Modify: `src/app/(app)/proposals/[proposalId]/page.tsx`

- [ ] **Step 1: Add "Contratos" to SidebarNav**

Add `FileSignature` icon import and entry between "Propostas" and "Projetos":

```tsx
import { FileSignature } from "lucide-react";
// ...
{ label: "Contratos", href: "/contracts", icon: FileSignature },
```

- [ ] **Step 2: Add contracts section to service detail page**

Between the Propostas section and Documentos section, add a "Contratos" block:

```tsx
import { listContracts } from "@/features/contracts/actions";
import { ContractStatusBadge } from "@/features/contracts/ContractStatusBadge";
// ...
const contracts = await listContracts(tenantId, { serviceId });
// ...
<div className="rounded-xl border border-zinc-200 bg-white">
  <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
    <h2 className="text-base font-semibold text-zinc-900">Contratos</h2>
    <Link
      href={`/contracts/new?serviceId=${serviceId}`}
      className="text-sm font-medium text-blue-600 hover:text-blue-500"
    >
      Criar Contrato →
    </Link>
  </div>
  {contracts.length === 0 ? (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <p className="text-sm text-zinc-400">Nenhum contrato vinculado a este serviço.</p>
    </div>
  ) : (
    <div className="divide-y divide-zinc-100">
      {contracts.map((contract) => (
        <Link
          key={contract.id}
          href={`/contracts/${contract.id}`}
          className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">
              <span className="font-mono text-zinc-400">{contract.number}</span> {contract.title}
            </p>
          </div>
          <div className="ml-4 flex items-center gap-3">
            <ContractStatusBadge status={contract.status} />
          </div>
        </Link>
      ))}
    </div>
  )}
</div>
```

Wire the `service._count.contracts` stat link to `/contracts?serviceId=...` (or `/contracts` for now).

- [ ] **Step 3: Add contracts section to proposal detail page**

Query contracts with matching `proposalId` and show a compact list + CTA:

```tsx
import { listContracts } from "@/features/contracts/actions";
import { ContractStatusBadge } from "@/features/contracts/ContractStatusBadge";

const contracts = await listContracts(tenantId, { proposalId });
```

Add between the info section and the action buttons.

- [ ] **Step 4: Commit**

```bash
git add src/components/app-shell/SidebarNav.tsx src/app/\(app\)/services/\[serviceId\]/page.tsx src/app/\(app\)/proposals/\[proposalId\]/page.tsx
git commit -m "feat: add contracts sidebar entry and service/proposal detail sections"
```

---

### Task 5: Seed demo data + E2E tests

**Files:**
- Modify: `prisma/seed.ts` (or `scripts/seed-demo.ts`)

- [ ] **Step 1: Add contract seed data**

```ts
// After proposals are created, add contracts
const contract1 = await prisma.contract.create({
  data: {
    tenantId: demoBeta.id,
    serviceId: service1.id,
    proposalId: acceptedProposal.id,
    number: "CT-00001",
    title: "Contrato de Projeto Estrutural - Demo Beta",
    status: "SIGNED",
    signedAt: new Date(),
  },
});

await prisma.contract.create({
  data: {
    tenantId: demoBeta.id,
    serviceId: service2.id,
    number: "CT-00002",
    title: "Contrato de Regularização - Demo Beta",
    status: "DRAFT",
  },
});
```

Ensure cleanup order: `contract.deleteMany()` before `proposal.deleteMany()` before `service.deleteMany()`.

- [ ] **Step 2: Run E2E test**

```bash
pnpm test:e2e
```

- [ ] **Step 3: Run all gates**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && git diff --check
```

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: add contract demo seed data"
```
