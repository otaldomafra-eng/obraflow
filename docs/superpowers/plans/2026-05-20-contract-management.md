# Contract Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete contract CRUD workflow using the existing Prisma `Contract` model.

**Architecture:** Create `src/features/contracts/` following the existing proposals/documents patterns. No migration is needed and no `title` field may be used, because `Contract` currently has only `number`, `status`, `signedAt`, `serviceId`, and optional `proposalId`.

**Tech Stack:** Next.js 16 App Router, Server Actions, Prisma, Zod, Vitest, Playwright.

---

## Guardrails

- Read `AGENTS.md` before writing code.
- Before editing Next.js routes/actions, read the relevant guide in `node_modules/next/dist/docs/`.
- Do not add a migration in this slice.
- Do not add `Contract.title`; use `Contrato ${contract.number}` in headings and labels.
- Use `listServiceOptions(tenantId)` from `src/features/services/actions.ts` for form service options.
- Do not deploy, merge, or push.

## Files

Create:

- `src/features/contracts/actions.ts`
- `src/features/contracts/ContractStatusBadge.tsx`
- `src/features/contracts/ContractForm.tsx`
- `src/features/contracts/ContractList.tsx`
- `src/features/contracts/ContractDetail.tsx`
- `src/app/(app)/contracts/page.tsx`
- `src/app/(app)/contracts/new/page.tsx`
- `src/app/(app)/contracts/[contractId]/page.tsx`
- `src/app/(app)/contracts/[contractId]/edit/page.tsx`
- `tests/unit/features/contracts/schema.test.ts`
- `tests/unit/features/contracts/actions.test.ts`
- `tests/e2e/contract-flow.spec.ts`

Modify:

- `src/components/app-shell/SidebarNav.tsx`
- `src/app/(app)/services/[serviceId]/page.tsx`
- `src/app/(app)/proposals/[proposalId]/page.tsx`
- `prisma/seed.ts`

---

### Task 1: Contract Actions and Unit Tests

**Files:**
- Create: `src/features/contracts/actions.ts`
- Create: `tests/unit/features/contracts/schema.test.ts`
- Create: `tests/unit/features/contracts/actions.test.ts`

- [ ] **Step 1: Write schema tests**

Create `tests/unit/features/contracts/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  CONTRACT_STATUSES,
  createContractSchema,
  updateContractSchema,
} from "@/features/contracts/actions";

describe("contract schema validation", () => {
  it("validates create input with required serviceId only", () => {
    const result = createContractSchema.parse({ serviceId: "svc-1" });
    expect(result.serviceId).toBe("svc-1");
    expect(result.status).toBeUndefined();
  });

  it("accepts optional proposalId", () => {
    const result = createContractSchema.parse({
      serviceId: "svc-1",
      proposalId: "prop-1",
    });
    expect(result.proposalId).toBe("prop-1");
  });

  it("accepts valid statuses", () => {
    for (const status of CONTRACT_STATUSES) {
      const result = createContractSchema.parse({ serviceId: "svc-1", status });
      expect(result.status).toBe(status);
    }
  });

  it("rejects invalid status", () => {
    expect(() =>
      createContractSchema.parse({ serviceId: "svc-1", status: "INVALID" }),
    ).toThrow();
  });

  it("update accepts status only", () => {
    const result = updateContractSchema.parse({ status: "SIGNED" });
    expect(result.status).toBe("SIGNED");
  });

  it("update rejects number changes", () => {
    expect(() => updateContractSchema.parse({ number: "CT-99999" })).toThrow();
  });

  it("update rejects service/proposal reassignment", () => {
    expect(() => updateContractSchema.parse({ serviceId: "svc-2" })).toThrow();
    expect(() => updateContractSchema.parse({ proposalId: "prop-2" })).toThrow();
  });
});
```

- [ ] **Step 2: Write action tests**

Create `tests/unit/features/contracts/actions.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    contract: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    service: { findUnique: vi.fn() },
    proposal: { findFirst: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));

import {
  createContract,
  generateContractNumber,
  getContract,
  listContracts,
  updateContract,
} from "@/features/contracts/actions";

describe("contract actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("generates the next number from the max existing CT suffix", async () => {
    prismaMock.contract.findMany.mockResolvedValue([
      { number: "CT-00001" },
      { number: "CT-00009" },
      { number: "LEGACY-7" },
    ]);

    await expect(generateContractNumber("t-1")).resolves.toBe("CT-00010");
  });

  it("creates a contract with generated number", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    prismaMock.contract.findMany.mockResolvedValue([]);
    prismaMock.contract.create.mockResolvedValue({
      id: "ct-1",
      tenantId: "t-1",
      serviceId: "svc-1",
      proposalId: null,
      number: "CT-00001",
      status: "DRAFT",
      signedAt: null,
    });

    const result = await createContract("t-1", { serviceId: "svc-1" });

    expect(result.number).toBe("CT-00001");
    expect(prismaMock.contract.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: "t-1",
        serviceId: "svc-1",
        proposalId: null,
        number: "CT-00001",
        status: "DRAFT",
      }),
    });
  });

  it("rejects create when service is outside tenant", async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);

    await expect(createContract("t-1", { serviceId: "svc-x" })).rejects.toThrow(
      "does not belong to tenant",
    );
    expect(prismaMock.contract.create).not.toHaveBeenCalled();
  });

  it("validates proposal belongs to the selected service", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    prismaMock.proposal.findFirst.mockResolvedValue(null);

    await expect(
      createContract("t-1", { serviceId: "svc-1", proposalId: "prop-x" }),
    ).rejects.toThrow("does not belong to service");
  });

  it("sets signedAt when status becomes SIGNED", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({ id: "ct-1", signedAt: null });
    prismaMock.contract.update.mockResolvedValue({ id: "ct-1", status: "SIGNED" });

    await updateContract("t-1", "ct-1", { status: "SIGNED" });

    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "t-1", id: "ct-1" } },
      data: { status: "SIGNED", signedAt: expect.any(Date) },
    });
  });

  it("clears signedAt when status leaves SIGNED", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({
      id: "ct-1",
      signedAt: new Date("2026-01-01"),
    });
    prismaMock.contract.update.mockResolvedValue({ id: "ct-1", status: "ISSUED" });

    await updateContract("t-1", "ct-1", { status: "ISSUED" });

    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "t-1", id: "ct-1" } },
      data: { status: "ISSUED", signedAt: null },
    });
  });

  it("lists contracts with filters", async () => {
    prismaMock.contract.findMany.mockResolvedValue([]);

    await listContracts("t-1", { serviceId: "svc-1", status: "SIGNED", search: "00010" });

    expect(prismaMock.contract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: "t-1",
          serviceId: "svc-1",
          status: "SIGNED",
          number: { contains: "00010", mode: "insensitive" },
        },
      }),
    );
  });

  it("gets a contract by tenant and id", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({ id: "ct-1", number: "CT-00001" });
    await expect(getContract("t-1", "ct-1")).resolves.toEqual({
      id: "ct-1",
      number: "CT-00001",
    });
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

```bash
pnpm test tests/unit/features/contracts/schema.test.ts tests/unit/features/contracts/actions.test.ts
```

Expected: fail because `src/features/contracts/actions.ts` does not exist.

- [ ] **Step 4: Implement actions**

Create `src/features/contracts/actions.ts`:

```ts
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db/client";

export const CONTRACT_STATUSES = ["DRAFT", "ISSUED", "SIGNED", "COMPLETED", "CANCELLED"] as const;

export const createContractSchema = z.object({
  serviceId: z.string().min(1),
  proposalId: z.string().min(1).optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
}).strict();

export const updateContractSchema = z.object({
  status: z.enum(CONTRACT_STATUSES).optional(),
}).strict();

export type CreateContractInput = z.input<typeof createContractSchema>;
export type UpdateContractInput = z.input<typeof updateContractSchema>;

const contractInclude = {
  service: {
    select: {
      id: true,
      title: true,
      client: { select: { id: true, name: true } },
      property: { select: { id: true, name: true } },
    },
  },
  proposal: { select: { id: true, title: true } },
} as const;

async function assertServiceBelongsToTenant(tenantId: string, serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { tenantId_id: { tenantId, id: serviceId } },
    select: { id: true },
  });
  if (!service) throw new Error(`Service ${serviceId} does not belong to tenant ${tenantId}`);
}

async function assertProposalBelongsToService(tenantId: string, serviceId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { tenantId, serviceId, id: proposalId },
    select: { id: true },
  });
  if (!proposal) throw new Error(`Proposal ${proposalId} does not belong to service ${serviceId} in tenant ${tenantId}`);
}

async function assertContractBelongsToTenant(tenantId: string, contractId: string) {
  const contract = await prisma.contract.findFirst({
    where: { tenantId, id: contractId },
    select: { id: true, signedAt: true },
  });
  if (!contract) throw new Error(`Contract ${contractId} does not belong to tenant ${tenantId}`);
  return contract;
}

export async function generateContractNumber(tenantId: string) {
  const contracts = await prisma.contract.findMany({
    where: { tenantId, number: { startsWith: "CT-" } },
    select: { number: true },
  });

  const maxSeq = contracts.reduce((max, contract) => {
    const match = /^CT-(\d+)$/.exec(contract.number);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return `CT-${String(maxSeq + 1).padStart(5, "0")}`;
}

function statusTimestampData(status: string | undefined, currentSignedAt: Date | null) {
  if (!status) return {};
  if (status === "SIGNED" && !currentSignedAt) return { signedAt: new Date() };
  if (status !== "SIGNED" && currentSignedAt) return { signedAt: null };
  return {};
}

export async function createContract(tenantId: string, input: CreateContractInput) {
  const data = createContractSchema.parse(input);
  await assertServiceBelongsToTenant(tenantId, data.serviceId);
  if (data.proposalId) await assertProposalBelongsToService(tenantId, data.serviceId, data.proposalId);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const number = await generateContractNumber(tenantId);
    try {
      return await prisma.contract.create({
        data: {
          tenantId,
          serviceId: data.serviceId,
          proposalId: data.proposalId ?? null,
          number,
          status: data.status ?? "DRAFT",
          ...statusTimestampData(data.status ?? "DRAFT", null),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 2) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Could not generate a unique contract number");
}

export async function updateContract(tenantId: string, contractId: string, input: UpdateContractInput) {
  const data = updateContractSchema.parse(input);
  const current = await assertContractBelongsToTenant(tenantId, contractId);

  return prisma.contract.update({
    where: { tenantId_id: { tenantId, id: contractId } },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...statusTimestampData(data.status, current.signedAt),
    },
  });
}

export async function listContracts(
  tenantId: string,
  options?: { serviceId?: string; proposalId?: string; status?: string; search?: string },
) {
  return prisma.contract.findMany({
    where: {
      tenantId,
      ...(options?.serviceId ? { serviceId: options.serviceId } : {}),
      ...(options?.proposalId ? { proposalId: options.proposalId } : {}),
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.search ? { number: { contains: options.search, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: contractInclude,
  });
}

export async function getContract(tenantId: string, contractId: string) {
  return prisma.contract.findFirst({
    where: { tenantId, id: contractId },
    include: contractInclude,
  });
}
```

- [ ] **Step 5: Run focused tests**

```bash
pnpm test tests/unit/features/contracts/schema.test.ts tests/unit/features/contracts/actions.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/contracts/actions.ts tests/unit/features/contracts
git commit -m "feat: add contract actions"
```

---

### Task 2: Contract Components

**Files:**
- Create: `src/features/contracts/ContractStatusBadge.tsx`
- Create: `src/features/contracts/ContractForm.tsx`
- Create: `src/features/contracts/ContractList.tsx`
- Create: `src/features/contracts/ContractDetail.tsx`

- [ ] **Step 1: Implement components**

Follow existing `src/features/documents/*` and `src/features/proposals/*` structure. Required behavior:

- `ContractStatusBadge` maps statuses to PT-BR labels from the spec.
- `ContractForm` supports create/edit. Create posts `serviceId`, optional hidden `proposalId`, and `status`; edit posts `status` only. It must not render a `title` or `number` input.
- `ContractList` renders number, client, service, proposal, status, signedAt, and detail link.
- `ContractDetail` uses heading `Contrato {contract.number}` and links to service/proposal/client/property when available.

- [ ] **Step 2: Run quality checks**

```bash
pnpm lint
pnpm typecheck
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/contracts
git commit -m "feat: add contract UI components"
```

---

### Task 3: Contract Routes

**Files:**
- Create: `src/app/(app)/contracts/page.tsx`
- Create: `src/app/(app)/contracts/new/page.tsx`
- Create: `src/app/(app)/contracts/[contractId]/page.tsx`
- Create: `src/app/(app)/contracts/[contractId]/edit/page.tsx`

- [ ] **Step 1: Implement routes**

Required behavior:

- `/contracts`: list contracts with `status`, `serviceId`, and `search` query filters.
- `/contracts/new`: uses `listServiceOptions(tenantId)` and `createContract`; accepts `?serviceId=` and `?proposalId=`.
- `/contracts/[contractId]`: uses `getContract`, `notFound` when missing.
- `/contracts/[contractId]/edit`: edits status only through `updateContract`.
- Revalidate `/contracts`, `/services/{serviceId}`, and `/proposals/{proposalId}` when applicable.

- [ ] **Step 2: Run checks**

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Expected: pass and build output includes 4 `/contracts` routes.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/(app)/contracts'
git commit -m "feat: add contract routes"
```

---

### Task 4: Sidebar and Detail Integrations

**Files:**
- Modify: `src/components/app-shell/SidebarNav.tsx`
- Modify: `src/app/(app)/services/[serviceId]/page.tsx`
- Modify: `src/app/(app)/proposals/[proposalId]/page.tsx`

- [ ] **Step 1: Add sidebar entry**

Add `FileSignature` from `lucide-react` and add `Contratos` to the `Comercial` group after `Propostas`.

- [ ] **Step 2: Add service detail contracts section**

Use `listContracts(tenantId, { serviceId })`. Add a `Contratos` section below `Propostas` and above `Documentos` with:

- CTA `/contracts/new?serviceId=${serviceId}`;
- rows linking to `/contracts/${contract.id}`;
- `ContractStatusBadge`;
- signed date when present.

Also make the contract stat card link to `/contracts?serviceId=${serviceId}`.

- [ ] **Step 3: Add proposal detail contracts section**

Use `listContracts(tenantId, { serviceId: proposal.serviceId, proposalId })`. Add a `Contratos` section with CTA `/contracts/new?serviceId=${proposal.serviceId}&proposalId=${proposalId}`.

- [ ] **Step 4: Run checks and commit**

```bash
pnpm lint
pnpm typecheck
git add src/components/app-shell/SidebarNav.tsx 'src/app/(app)/services/[serviceId]/page.tsx' 'src/app/(app)/proposals/[proposalId]/page.tsx'
git commit -m "feat: integrate contracts into navigation and detail pages"
```

---

### Task 5: Seed and E2E

**Files:**
- Modify: `prisma/seed.ts`
- Create: `tests/e2e/contract-flow.spec.ts`

- [ ] **Step 1: Update seed**

Add `prisma.contract.deleteMany(...)` before deleting proposals/services. Seed at least:

- `CT-DEMO-001`, status `SIGNED`, linked to an accepted proposal;
- `CT-DEMO-002`, status `DRAFT` or `ISSUED`, linked to a service without proposal.

Use existing seeded service/proposal variables; do not add schema fields.

- [ ] **Step 2: Add e2e test**

Create `tests/e2e/contract-flow.spec.ts` covering:

- login;
- create client/property/service;
- create contract from service detail;
- verify detail heading `Contrato CT-`;
- verify service detail shows the contract;
- create proposal and create contract from proposal detail;
- verify proposal detail shows the linked contract.

- [ ] **Step 3: Run all gates**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
git diff --check
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts tests/e2e/contract-flow.spec.ts
git commit -m "test: add contract seed data and e2e flow"
```

---

## Final Review Checklist

- No references to `contract.title`.
- No migration created.
- `number`, `serviceId`, and `proposalId` are not editable after create.
- `signedAt` is set/cleared by status transitions only.
- `/contracts`, service detail, and proposal detail all work.
- All gates pass.
