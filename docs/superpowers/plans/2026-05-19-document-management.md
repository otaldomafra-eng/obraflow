# Document Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build complete Document Management workflow: CRUD, service/proposal integration, seed data, and tests.

**Architecture:** Feature module under `src/features/documents/` following proposals pattern. One migration to add `proposalId` to Document model (matching Contract's FK pattern). Routes under `/(app)/documents/`. Integration sections in service and proposal detail pages.

**Tech Stack:** Prisma (migration), Next.js 16 Server Actions, Zod, Vitest, Playwright

---

### Task 1: Prisma migration — add proposalId to Document

**Files:**
- Modify: `prisma/schema.prisma` (Document model)

- [ ] **Step 1: Edit Document model in schema.prisma**

Add `proposalId String?` field, relation to Proposal, and index. Insert before the closing `@@` block:

```prisma
model Document {
  id          String             @id @default(cuid())
  tenantId    String
  externalKey String?
  serviceId   String
  proposalId  String?
  title       String
  url         String
  visibility  DocumentVisibility @default(INTERNAL)
  mimeType    String?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  tenant      Tenant             @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  service     Service            @relation(fields: [tenantId, serviceId], references: [tenantId, id], onDelete: Restrict)
  proposal    Proposal?          @relation(fields: [tenantId, serviceId, proposalId], references: [tenantId, serviceId, id], onDelete: Restrict)

  @@unique([tenantId, id])
  @@unique([tenantId, externalKey])
  @@index([tenantId, serviceId])
  @@index([tenantId, serviceId, proposalId])
}
```

- [ ] **Step 2: Generate migration**

```bash
pnpm prisma migrate dev --name add_proposal_id_to_document --create-only
```

Check the generated SQL has:
```sql
ALTER TABLE "Document" ADD COLUMN "proposalId" TEXT;
ALTER TABLE "Document" ADD CONSTRAINT "Document_proposalId_fkey" FOREIGN KEY ...;
CREATE INDEX "Document_tenantId_serviceId_proposalId_idx" ON "Document"("tenantId", "serviceId", "proposalId");
```

- [ ] **Step 3: Apply migration**

```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add proposalId to Document model"
```

---

### Task 2: Document actions (Zod schemas + CRUD + proposal validation)

**Files:**
- Create: `src/features/documents/actions.ts`
- Test: `tests/unit/features/documents/schema.test.ts`
- Test: `tests/unit/features/documents/actions.test.ts`

- [ ] **Step 1: Write and verify failing schema tests**

```typescript
// tests/unit/features/documents/schema.test.ts
import { describe, expect, it } from "vitest";
import { createDocumentSchema, updateDocumentSchema } from "@/features/documents/actions";

describe("document schema validation", () => {
  it("validates create with required fields only", () => {
    const result = createDocumentSchema.parse({
      serviceId: "svc-1",
      title: "Memorial",
      url: "https://example.com/doc.pdf",
    });
    expect(result.serviceId).toBe("svc-1");
    expect(result.title).toBe("Memorial");
  });

  it("rejects empty title", () => {
    expect(() =>
      createDocumentSchema.parse({ serviceId: "svc-1", title: "", url: "https://x.com" }),
    ).toThrow();
  });

  it("rejects empty url", () => {
    expect(() =>
      createDocumentSchema.parse({ serviceId: "svc-1", title: "Doc", url: "" }),
    ).toThrow();
  });

  it("accepts optional proposalId", () => {
    const result = createDocumentSchema.parse({
      serviceId: "svc-1",
      title: "Doc",
      url: "https://x.com",
      proposalId: "prop-1",
    });
    expect(result.proposalId).toBe("prop-1");
  });

  it("accepts all valid visibilities", () => {
    for (const v of ["INTERNAL", "CLIENT_VISIBLE", "SUPPLIER_VISIBLE"]) {
      const result = createDocumentSchema.parse({
        serviceId: "svc-1",
        title: "Doc",
        url: "https://x.com",
        visibility: v,
      });
      expect(result.visibility).toBe(v);
    }
  });

  it("rejects invalid visibility", () => {
    expect(() =>
      createDocumentSchema.parse({
        serviceId: "svc-1",
        title: "Doc",
        url: "https://x.com",
        visibility: "INVALID",
      }),
    ).toThrow();
  });

  it("update validates partial fields", () => {
    const result = updateDocumentSchema.parse({ title: "Novo Título" });
    expect(result.title).toBe("Novo Título");
  });
});
```

- [ ] **Step 2: Write and verify failing action tests**

```typescript
// tests/unit/features/documents/actions.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    document: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    service: { findUnique: vi.fn() },
    proposal: { findFirst: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));

import { createDocument, getDocument, listDocuments, updateDocument } from "@/features/documents/actions";

describe("document actions", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("createDocument", () => {
    it("creates a document successfully", async () => {
      prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
      prismaMock.document.create.mockResolvedValue({
        id: "doc-1", tenantId: "t-1", serviceId: "svc-1",
        title: "Memorial", url: "https://x.com", visibility: "INTERNAL",
      });

      const result = await createDocument("t-1", {
        serviceId: "svc-1", title: "Memorial", url: "https://x.com",
      });
      expect(result.title).toBe("Memorial");
      expect(prismaMock.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ tenantId: "t-1", serviceId: "svc-1", title: "Memorial" }),
      });
    });

    it("rejects create when service does not belong to tenant", async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);
      await expect(
        createDocument("t-1", { serviceId: "svc-x", title: "Doc", url: "https://x.com" }),
      ).rejects.toThrow("does not belong to tenant");
    });

    it("validates proposal belongs to service when proposalId provided", async () => {
      prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
      prismaMock.proposal.findFirst.mockResolvedValue(null);

      await expect(
        createDocument("t-1", {
          serviceId: "svc-1", title: "Doc", url: "https://x.com", proposalId: "prop-x",
        }),
      ).rejects.toThrow("does not belong to service");
    });

    it("creates with proposalId when proposal belongs to service", async () => {
      prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
      prismaMock.proposal.findFirst.mockResolvedValue({ id: "prop-1" });
      prismaMock.document.create.mockResolvedValue({
        id: "doc-1", tenantId: "t-1", serviceId: "svc-1", proposalId: "prop-1",
        title: "Doc", url: "https://x.com", visibility: "INTERNAL",
      });

      const result = await createDocument("t-1", {
        serviceId: "svc-1", title: "Doc", url: "https://x.com", proposalId: "prop-1",
      });
      expect(result.proposalId).toBe("prop-1");
    });
  });

  describe("listDocuments", () => {
    it("lists documents filtered by serviceId", async () => {
      prismaMock.document.findMany.mockResolvedValue([]);
      await listDocuments("t-1", { serviceId: "svc-1" });
      expect(prismaMock.document.findMany).toHaveBeenCalledWith({
        where: { tenantId: "t-1", serviceId: "svc-1" },
        orderBy: { createdAt: "desc" },
        include: expect.objectContaining({ service: expect.anything() }),
      });
    });

    it("lists documents filtered by proposalId", async () => {
      prismaMock.document.findMany.mockResolvedValue([]);
      await listDocuments("t-1", { serviceId: "svc-1", proposalId: "prop-1" });
      expect(prismaMock.document.findMany).toHaveBeenCalledWith({
        where: { tenantId: "t-1", serviceId: "svc-1", proposalId: "prop-1" },
        orderBy: { createdAt: "desc" },
        include: expect.objectContaining({ service: expect.anything() }),
      });
    });
  });

  describe("getDocument", () => {
    it("gets a single document by id", async () => {
      const mock = {
        id: "doc-1", tenantId: "t-1", serviceId: "svc-1",
        title: "Doc", url: "https://x.com", visibility: "INTERNAL",
        proposalId: null, mimeType: null,
        service: { id: "svc-1", title: "Svc", client: { id: "c-1", name: "Cli" }, property: null },
        proposal: null,
      };
      prismaMock.document.findFirst.mockResolvedValue(mock);
      const result = await getDocument("t-1", "doc-1");
      expect(result?.title).toBe("Doc");
    });

    it("returns null for non-existent document", async () => {
      prismaMock.document.findFirst.mockResolvedValue(null);
      const result = await getDocument("t-1", "nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("updateDocument", () => {
    it("updates document title", async () => {
      prismaMock.document.findFirst.mockResolvedValue({ id: "doc-1", tenantId: "t-1" });
      prismaMock.document.update.mockResolvedValue({} as never);

      await updateDocument("t-1", "doc-1", { title: "Novo" });

      const call = prismaMock.document.update.mock.calls[0][0];
      expect(call.where.tenantId_id).toEqual({ tenantId: "t-1", id: "doc-1" });
      expect(call.data.title).toBe("Novo");
      expect(call.data.serviceId).toBeUndefined();
      expect(call.data.proposalId).toBeUndefined();
    });

    it("rejects update when document not found", async () => {
      prismaMock.document.findFirst.mockResolvedValue(null);
      await expect(updateDocument("t-1", "doc-x", { title: "X" })).rejects.toThrow("does not belong to tenant");
    });
  });
});
```

Run:
```bash
pnpm test tests/unit/features/documents/schema.test.ts tests/unit/features/documents/actions.test.ts
```
Expected: FAIL (import errors — files don't exist yet)

- [ ] **Step 3: Create actions.ts**

```typescript
// src/features/documents/actions.ts
import { z } from "zod";
import { prisma } from "@/server/db/client";

const VISIBILITIES = ["INTERNAL", "CLIENT_VISIBLE", "SUPPLIER_VISIBLE"] as const;

export const createDocumentSchema = z.object({
  serviceId: z.string().min(1),
  proposalId: z.string().optional(),
  title: z.string().min(1),
  url: z.string().min(1),
  visibility: z.enum(VISIBILITIES).optional(),
  mimeType: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  visibility: z.enum(VISIBILITIES).optional(),
  mimeType: z.string().optional(),
});

export type CreateDocumentInput = z.input<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.input<typeof updateDocumentSchema>;

async function assertServiceBelongsToTenant(tenantId: string, serviceId: string): Promise<void> {
  const service = await prisma.service.findUnique({
    where: { tenantId_id: { tenantId, id: serviceId } },
    select: { id: true },
  });
  if (!service) throw new Error(`Service ${serviceId} does not belong to tenant ${tenantId}`);
}

async function assertProposalBelongsToService(tenantId: string, serviceId: string, proposalId: string): Promise<void> {
  const proposal = await prisma.proposal.findFirst({
    where: { tenantId, serviceId, id: proposalId },
    select: { id: true },
  });
  if (!proposal) throw new Error(`Proposal ${proposalId} does not belong to service ${serviceId} in tenant ${tenantId}`);
}

export async function createDocument(tenantId: string, input: CreateDocumentInput) {
  const data = createDocumentSchema.parse(input);

  await assertServiceBelongsToTenant(tenantId, data.serviceId);

  if (data.proposalId) {
    await assertProposalBelongsToService(tenantId, data.serviceId, data.proposalId);
  }

  return prisma.document.create({
    data: {
      tenantId,
      serviceId: data.serviceId,
      proposalId: data.proposalId ?? null,
      title: data.title,
      url: data.url,
      visibility: data.visibility ?? "INTERNAL",
      mimeType: data.mimeType ?? null,
    },
  });
}

export async function updateDocument(tenantId: string, documentId: string, input: UpdateDocumentInput) {
  const data = updateDocumentSchema.parse(input);

  const existing = await prisma.document.findFirst({
    where: { tenantId, id: documentId },
    select: { id: true },
  });

  if (!existing) throw new Error(`Document ${documentId} does not belong to tenant ${tenantId}`);

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.visibility !== undefined) updateData.visibility = data.visibility;
  if (data.mimeType !== undefined) updateData.mimeType = data.mimeType ?? null;

  return prisma.document.update({
    where: { tenantId_id: { tenantId, id: documentId } },
    data: updateData,
  });
}

export async function listDocuments(tenantId: string, options?: {
  serviceId?: string;
  proposalId?: string;
  visibility?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = { tenantId };

  if (options?.serviceId) where.serviceId = options.serviceId;
  if (options?.proposalId) where.proposalId = options.proposalId;
  if (options?.visibility) where.visibility = options.visibility;
  if (options?.search) {
    where.title = { contains: options.search, mode: "insensitive" };
  }

  return prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
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

export async function getDocument(tenantId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { tenantId, id: documentId },
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

export { createDocumentSchema, updateDocumentSchema };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/unit/features/documents/schema.test.ts tests/unit/features/documents/actions.test.ts
```
Expected: PASS (all 14 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/documents/actions.ts tests/unit/features/documents/
git commit -m "feat: add document actions with proposalId validation"
```

---

### Task 3: Document UI components

**Files:**
- Create: `src/features/documents/DocumentVisibilityBadge.tsx`
- Create: `src/features/documents/DocumentForm.tsx`
- Create: `src/features/documents/DocumentList.tsx`
- Create: `src/features/documents/DocumentDetail.tsx`

- [ ] **Step 1: Create DocumentVisibilityBadge**

```tsx
// src/features/documents/DocumentVisibilityBadge.tsx
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
```

- [ ] **Step 2: Create DocumentForm**

```tsx
// src/features/documents/DocumentForm.tsx
"use client";
import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ServiceOption {
  id: string;
  title: string;
  client: { name: string };
}

interface ProposalOption {
  id: string;
  title: string;
}

interface DocumentFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  services: ServiceOption[];
  proposals?: ProposalOption[];
  document?: {
    serviceId: string;
    proposalId?: string | null;
    title: string;
    url: string;
    visibility: string;
    mimeType: string | null;
  };
}

export function DocumentForm({ action, services, proposals, document: doc }: DocumentFormProps) {
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
    if (state?.redirectUrl) router.push(state.redirectUrl);
  }, [state, router]);

  const hasFixedService = doc || preselectedServiceId;
  const fixedService = hasFixedService
    ? services.find((s) => s.id === (doc?.serviceId ?? preselectedServiceId))
    : null;

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Serviço" id="serviceId">
        {hasFixedService ? (
          <>
            <input type="hidden" name="serviceId" value={doc?.serviceId ?? preselectedServiceId ?? ""} />
            <input
              id="serviceId" readOnly
              value={fixedService ? `${fixedService.title} — ${fixedService.client.name}` : "Carregando..."}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
            />
          </>
        ) : (
          <select id="serviceId" name="serviceId" required
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">Selecione um serviço</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.title} — {s.client.name}</option>
            ))}
          </select>
        )}
      </Field>

      {proposals && proposals.length > 0 && (
        <Field label="Proposta (opcional)" id="proposalId">
          <input type="hidden" name="proposalId" value={doc?.proposalId ?? preselectedProposalId ?? ""} />
          <input
            id="proposalId" readOnly
            value={
              doc?.proposalId ?? preselectedProposalId
                ? proposals.find((p) => p.id === (doc?.proposalId ?? preselectedProposalId))?.title ?? ""
                : ""
            }
            className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
          />
        </Field>
      )}

      <Field label="Título *" id="title">
        <input id="title" name="title" required
          defaultValue={doc?.title ?? ""}
          placeholder="Ex: Memorial Descritivo"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <Field label="URL do Arquivo *" id="url">
        <input id="url" name="url" type="url" required
          defaultValue={doc?.url ?? ""}
          placeholder="https://storage.example.com/documento.pdf"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Visibilidade" id="visibility">
          <select id="visibility" name="visibility"
            defaultValue={doc?.visibility ?? "INTERNAL"}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="INTERNAL">Interno</option>
            <option value="CLIENT_VISIBLE">Visível ao Cliente</option>
            <option value="SUPPLIER_VISIBLE">Visível ao Fornecedor</option>
          </select>
        </Field>
        <Field label="Tipo (opcional)" id="mimeType">
          <input id="mimeType" name="mimeType"
            defaultValue={doc?.mimeType ?? ""}
            placeholder="Ex: application/pdf"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      </div>

      <button type="submit" disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Salvando..." : doc ? "Salvar Documento" : "Adicionar Documento"}
      </button>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create DocumentList**

```tsx
// src/features/documents/DocumentList.tsx
import Link from "next/link";
import type { listDocuments } from "./actions";
import { DocumentVisibilityBadge } from "./DocumentVisibilityBadge";

interface Props {
  documents: Awaited<ReturnType<typeof listDocuments>>;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function DocumentList({ documents }: Props) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <p className="text-sm text-zinc-400">Nenhum documento encontrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left text-xs font-medium text-zinc-500">
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Serviço</th>
            <th className="px-4 py-3">Proposta</th>
            <th className="px-4 py-3">Visibilidade</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {documents.map((doc) => (
            <tr key={doc.id} className="transition-colors hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link href={`/documents/${doc.id}`} className="font-medium text-zinc-900 hover:text-blue-600 transition-colors">
                  {doc.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-500">
                <Link href={`/services/${doc.service.id}`} className="hover:text-blue-600 transition-colors">
                  {doc.service.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {doc.proposal ? (
                  <Link href={`/proposals/${doc.proposal.id}`} className="hover:text-blue-600 transition-colors">
                    {doc.proposal.title}
                  </Link>
                ) : (
                  <span className="text-zinc-300">—</span>
                )}
              </td>
              <td className="px-4 py-3"><DocumentVisibilityBadge visibility={doc.visibility} /></td>
              <td className="px-4 py-3 text-zinc-500">{doc.mimeType ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-500 tabular-nums">{formatDate(doc.createdAt)}</td>
              <td className="px-4 py-3">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Abrir →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Create DocumentDetail**

```tsx
// src/features/documents/DocumentDetail.tsx
import Link from "next/link";
import type { getDocument } from "./actions";
import { DocumentVisibilityBadge } from "./DocumentVisibilityBadge";

interface Props {
  document: NonNullable<Awaited<ReturnType<typeof getDocument>>>;
}

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function DocumentDetail({ document: doc }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{doc.title}</h1>
          <DocumentVisibilityBadge visibility={doc.visibility} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">Informações</h2>
        <dl className="divide-y divide-zinc-100">
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Serviço</dt>
            <dd className="text-sm text-zinc-900">
              <Link href={`/services/${doc.service.id}`} className="hover:text-blue-600 transition-colors">
                {doc.service.title}
              </Link>
            </dd>
          </div>
          {doc.proposal && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-medium text-zinc-500">Proposta</dt>
              <dd className="text-sm text-zinc-900">
                <Link href={`/proposals/${doc.proposal.id}`} className="hover:text-blue-600 transition-colors">
                  {doc.proposal.title}
                </Link>
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">URL</dt>
            <dd className="text-sm text-zinc-900">
              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 transition-colors break-all">
                {doc.url}
              </a>
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Visibilidade</dt>
            <dd className="text-sm"><DocumentVisibilityBadge visibility={doc.visibility} /></dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Tipo</dt>
            <dd className="text-sm text-zinc-900">{doc.mimeType ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Criado em</dt>
            <dd className="text-sm text-zinc-900 tabular-nums">{formatDate(doc.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-medium text-zinc-500">Atualizado em</dt>
            <dd className="text-sm text-zinc-900 tabular-nums">{formatDate(doc.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-6 py-4">
        <Link
          href={`/services/${doc.service.id}`}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          ← Voltar ao serviço
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={doc.url} target="_blank" rel="noopener noreferrer"
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Abrir Arquivo →
          </a>
          <Link
            href={`/documents/${doc.id}/edit`}
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/features/documents/DocumentVisibilityBadge.tsx src/features/documents/DocumentForm.tsx src/features/documents/DocumentList.tsx src/features/documents/DocumentDetail.tsx
git commit -m "feat: add document UI components (badge, form, list, detail)"
```

---

### Task 4: Document routes

**Files:**
- Create: `src/app/(app)/documents/page.tsx`
- Create: `src/app/(app)/documents/new/page.tsx`
- Create: `src/app/(app)/documents/[documentId]/page.tsx`
- Create: `src/app/(app)/documents/[documentId]/edit/page.tsx`
- Modify: `src/features/services/actions.ts` (add listServiceOptions if needed)

Note: `listServiceOptions` already exists from the proposals feature. Check it exists.

- [ ] **Step 1: Create /documents (list page)**

```tsx
// src/app/(app)/documents/page.tsx
import Link from "next/link";
import { requireTenantId } from "@/server/auth/tenant";
import { listDocuments } from "@/features/documents/actions";
import { DocumentList } from "@/features/documents/DocumentList";

export const dynamic = "force-dynamic";

const visibilityLabels: Record<string, string> = {
  INTERNAL: "Interno",
  CLIENT_VISIBLE: "Visível ao Cliente",
  SUPPLIER_VISIBLE: "Visível ao Fornecedor",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; visibility?: string; serviceId?: string }>;
}) {
  const tenantId = await requireTenantId();
  const params = await searchParams;

  const documents = await listDocuments(tenantId, {
    search: params.search,
    visibility: params.visibility,
    serviceId: params.serviceId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Documentos</h1>
          <p className="mt-1 text-sm text-zinc-500">Gerencie os arquivos vinculados a serviços e propostas.</p>
        </div>
        <Link
          href="/documents/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          + Novo Documento
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <form className="flex items-center gap-4">
            <input
              name="search" defaultValue={params.search ?? ""}
              placeholder="Buscar por título..."
              className="block w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <select name="visibility" defaultValue={params.visibility ?? ""}
              className="block rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            >
              <option value="">Todas as visibilidades</option>
              {Object.entries(visibilityLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Filtrar
            </button>
          </form>
        </div>
        <div className="p-6">
          <DocumentList documents={documents} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create /documents/new (create page)**

```tsx
// src/app/(app)/documents/new/page.tsx
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { requireTenantId } from "@/server/auth/tenant";
import { createDocument } from "@/features/documents/actions";
import { listServiceOptions } from "@/features/services/actions";
import { DocumentForm } from "@/features/documents/DocumentForm";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage() {
  const tenantId = await requireTenantId();
  const services = await listServiceOptions(tenantId);

  async function handleCreate(formData: FormData) {
    "use server";

    const proposalId = (formData.get("proposalId") as string) || undefined;

    const document = await createDocument(tenantId, {
      serviceId: formData.get("serviceId") as string,
      proposalId,
      title: formData.get("title") as string,
      url: formData.get("url") as string,
      visibility: (formData.get("visibility") as "INTERNAL" | "CLIENT_VISIBLE" | "SUPPLIER_VISIBLE") || undefined,
      mimeType: (formData.get("mimeType") as string) || undefined,
    });

    revalidatePath("/documents");
    revalidatePath(`/services/${document.serviceId}`);
    if (proposalId) revalidatePath(`/proposals/${proposalId}`);
    return { redirectUrl: `/documents/${document.id}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Novo Documento</h1>
        <p className="mt-1 text-sm text-zinc-500">Adicione um arquivo vinculado a um serviço ou proposta.</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <Suspense fallback={<div className="text-sm text-zinc-400">Carregando...</div>}>
          <DocumentForm action={handleCreate} services={services} />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create /documents/[documentId] (detail page)**

```tsx
// src/app/(app)/documents/[documentId]/page.tsx
import { notFound } from "next/navigation";
import { requireTenantId } from "@/server/auth/tenant";
import { getDocument } from "@/features/documents/actions";
import { DocumentDetail } from "@/features/documents/DocumentDetail";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { documentId } = await params;

  const document = await getDocument(tenantId, documentId);

  if (!document) notFound();

  return (
    <div className="space-y-6">
      <DocumentDetail document={document} />
    </div>
  );
}
```

- [ ] **Step 4: Create /documents/[documentId]/edit (edit page)**

```tsx
// src/app/(app)/documents/[documentId]/edit/page.tsx
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireTenantId } from "@/server/auth/tenant";
import { getDocument, updateDocument } from "@/features/documents/actions";
import { listServiceOptions } from "@/features/services/actions";
import { DocumentForm } from "@/features/documents/DocumentForm";

export const dynamic = "force-dynamic";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { documentId } = await params;

  const [document, services] = await Promise.all([
    getDocument(tenantId, documentId),
    listServiceOptions(tenantId),
  ]);

  if (!document) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";

    await updateDocument(tenantId, documentId, {
      title: (formData.get("title") as string) || undefined,
      url: (formData.get("url") as string) || undefined,
      visibility: (formData.get("visibility") as "INTERNAL" | "CLIENT_VISIBLE" | "SUPPLIER_VISIBLE") || undefined,
      mimeType: (formData.get("mimeType") as string) || undefined,
    });

    revalidatePath(`/documents/${documentId}`);
    revalidatePath("/documents");
    return { redirectUrl: `/documents/${documentId}` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Editar Documento</h1>
        <p className="mt-1 text-sm text-zinc-500">Atualize as informações do documento.</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <Suspense fallback={<div className="text-sm text-zinc-400">Carregando...</div>}>
          <DocumentForm
            action={handleUpdate}
            services={services}
            document={{
              serviceId: document.serviceId,
              proposalId: document.proposalId,
              title: document.title,
              url: document.url,
              visibility: document.visibility,
              mimeType: document.mimeType,
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/documents/
git commit -m "feat: add document CRUD routes"
```

---

### Task 5: Service detail integration — add Documents section

**Files:**
- Modify: `src/app/(app)/services/[serviceId]/page.tsx`

- [ ] **Step 1: Add documents import and data fetching to service detail page**

Add import:
```tsx
import { listDocuments } from "@/features/documents/actions";
```

After `const proposals = await listProposals(tenantId, { serviceId });` add:
```tsx
const documents = await listDocuments(tenantId, { serviceId });
```

- [ ] **Step 2: Add Documents section between Propostas and Tarefas**

After the Propostas section (line 242) and before the Tarefas section (line 244), insert:

```tsx
<div className="rounded-xl border border-zinc-200 bg-white">
  <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
    <h2 className="text-base font-semibold text-zinc-900">Documentos</h2>
    <Link
      href={`/documents/new?serviceId=${serviceId}`}
      className="text-sm font-medium text-blue-600 hover:text-blue-500"
    >
      Adicionar Documento →
    </Link>
  </div>
  {documents.length === 0 ? (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <p className="text-sm text-zinc-400">Nenhum documento vinculado a este serviço.</p>
    </div>
  ) : (
    <div className="divide-y divide-zinc-100">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          href={`/documents/${doc.id}`}
          className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{doc.title}</p>
            <p className="text-xs text-zinc-400">{doc.mimeType ?? "—"}</p>
          </div>
          <div className="ml-4 flex items-center gap-3">
            <DocumentVisibilityBadge visibility={doc.visibility} />
            <a
              href={doc.url} target="_blank" rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              Abrir →
            </a>
          </div>
        </Link>
      ))}
    </div>
  )}
</div>
```

Add import:
```tsx
import { DocumentVisibilityBadge } from "@/features/documents/DocumentVisibilityBadge";
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/services/[serviceId]/page.tsx
git commit -m "feat: add documents section to service detail"
```

---

### Task 6: Proposal detail integration — add Documents section

**Files:**
- Modify: `src/app/(app)/proposals/[proposalId]/page.tsx`

- [ ] **Step 1: Modify proposal detail page to show documents**

```tsx
// src/app/(app)/proposals/[proposalId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantId } from "@/server/auth/tenant";
import { ProposalDetail } from "@/features/proposals/ProposalDetail";
import { getProposal } from "@/features/proposals/actions";
import { listDocuments } from "@/features/documents/actions";
import { DocumentVisibilityBadge } from "@/features/documents/DocumentVisibilityBadge";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const tenantId = await requireTenantId();
  const { proposalId } = await params;

  const proposal = await getProposal(tenantId, proposalId);

  if (!proposal) notFound();

  const documents = await listDocuments(tenantId, {
    serviceId: proposal.serviceId,
    proposalId,
  });

  return (
    <div className="space-y-6">
      <ProposalDetail proposal={proposal} />

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Documentos</h2>
          <Link
            href={`/documents/new?serviceId=${proposal.serviceId}&proposalId=${proposalId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Adicionar Documento →
          </Link>
        </div>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <p className="text-sm text-zinc-400">Nenhum documento vinculado a esta proposta.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{doc.title}</p>
                  <p className="text-xs text-zinc-400">{doc.mimeType ?? "—"}</p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <DocumentVisibilityBadge visibility={doc.visibility} />
                  <a
                    href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Abrir →
                  </a>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/proposals/[proposalId]/page.tsx
git commit -m "feat: add documents section to proposal detail"
```

---

### Task 7: Demo seed data

**Files:**
- Modify: `scripts/seed-demo.ts`

- [ ] **Step 1: Edit seed-demo.ts — add documents cleanup + seeding**

**Cleanup** — after proposal cleanup and before service cleanup:
```typescript
// Documents cleanup
await prisma.document.deleteMany({
  where: { tenantId, serviceId: { in: demoServiceIds } },
});
```

**Seeding** — after proposals section:
```typescript
// ── Documents ──────────────────────────────────────────
console.log("  Seeding documents...");

const docService1 = await prisma.service.findFirst({
  where: { tenantId, title: "Demo Beta Reforma Residencial Completa" },
  select: { id: true },
});

const docService2 = await prisma.service.findFirst({
  where: { tenantId, title: "Demo Beta Aprovacao de Projeto Residencial" },
  select: { id: true },
});

const docService3 = await prisma.service.findFirst({
  where: { tenantId, title: "Demo Beta Projeto Estrutural" },
  select: { id: true },
});

const acceptedProposal = await prisma.proposal.findFirst({
  where: { tenantId, status: "ACCEPTED" },
  select: { id: true },
});

const sentProposal = await prisma.proposal.findFirst({
  where: { tenantId, status: "SENT" },
  select: { id: true },
});

if (docService1) {
  await prisma.document.create({
    data: {
      tenantId,
      serviceId: docService1.id,
      proposalId: acceptedProposal?.id ?? null,
      title: "Memorial Descritivo - Reforma Residencial",
      url: "https://exemplo.com/memorial-reforma.pdf",
      visibility: "CLIENT_VISIBLE",
      mimeType: "application/pdf",
    },
  });
}

if (docService2) {
  await prisma.document.create({
    data: {
      tenantId,
      serviceId: docService2.id,
      proposalId: sentProposal?.id ?? null,
      title: "Contrato de Aprovação de Projeto",
      url: "https://exemplo.com/contrato-aprovacao.pdf",
      visibility: "INTERNAL",
      mimeType: "application/pdf",
    },
  });
}

if (docService3) {
  await prisma.document.create({
    data: {
      tenantId,
      serviceId: docService3.id,
      title: "Imagem de Referência - Estrutural",
      url: "https://exemplo.com/referencia-estrutural.jpg",
      visibility: "SUPPLIER_VISIBLE",
      mimeType: "image/jpeg",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/seed-demo.ts
git commit -m "feat: add demo documents to seed"
```

---

### Task 8: E2E test — document flow

**Files:**
- Create: `tests/e2e/document-flow.spec.ts`

- [ ] **Step 1: Create e2e test file**

```typescript
// tests/e2e/document-flow.spec.ts
import { expect, test } from "@playwright/test";

const PREFIX = `Teste E2E ${Date.now()}`;

test.describe("fluxo de documentos", () => {
  test("cria documento a partir do servico, valida detalhe e link externo", async ({ page }) => {
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
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/clients/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const clientId = page.url().split("/").pop()!;

    // Create property
    await page.goto(`/properties/new?clientId=${clientId}`);
    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/properties/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const propertyId = page.url().split("/").pop()!;

    // Create service
    await page.goto(`/services/new?clientId=${clientId}&propertyId=${propertyId}`);
    await page.getByLabel("Título *").fill(`${PREFIX} - Serviço`);
    await page.getByLabel("Tipo de Serviço *").selectOption("TECHNICAL_PROJECT");
    await page.getByRole("button", { name: "Criar Serviço" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/services/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const serviceId = page.url().split("/").pop()!;

    // Navigate to service detail
    await page.goto(`/services/${serviceId}`);

    // Verify documents section exists
    await expect(page.getByText("Documentos")).toBeVisible();

    // Click "Adicionar Documento" link
    await page.getByRole("link", { name: /adicionar documento/i }).click();
    await page.waitForURL(`/documents/new?serviceId=${serviceId}`, { timeout: 10000 });

    // Fill document form
    await page.getByLabel("Título *").fill(`${PREFIX} - Memorial`);
    await page.getByLabel("URL do Arquivo *").fill("https://exemplo.com/teste.pdf");
    await page.getByLabel("Visibilidade").selectOption("CLIENT_VISIBLE");
    await page.getByLabel("Tipo (opcional)").fill("application/pdf");
    await page.getByRole("button", { name: "Adicionar Documento" }).click();

    // Wait for redirect to document detail
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/documents/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });

    // Verify title and metadata
    await expect(page.getByRole("heading", { name: `${PREFIX} - Memorial` })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Visível ao Cliente")).toBeVisible({ timeout: 5000 });

    // Verify external link exists
    const openLink = page.getByRole("link", { name: /abrir arquivo/i });
    await expect(openLink).toBeVisible();
    await expect(openLink).toHaveAttribute("href", "https://exemplo.com/teste.pdf");
    await expect(openLink).toHaveAttribute("target", "_blank");

    // Verify service detail shows the document
    await page.goto(`/services/${serviceId}`);
    await expect(page.getByText(`${PREFIX} - Memorial`)).toBeVisible({ timeout: 5000 });
  });

  test("cria documento com proposta e valida no detalhe da proposta", async ({ page }) => {
    test.setTimeout(90000);

    // Login
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // Create client → property → service (shorter chain relying on demo for proposal)
    await page.goto("/clients/new");
    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente 2`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/clients/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const clientId = page.url().split("/").pop()!;

    await page.goto(`/properties/new?clientId=${clientId}`);
    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel 2`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/properties/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const propertyId = page.url().split("/").pop()!;

    await page.goto(`/services/new?clientId=${clientId}&propertyId=${propertyId}`);
    await page.getByLabel("Título *").fill(`${PREFIX} - Serviço 2`);
    await page.getByLabel("Tipo de Serviço *").selectOption("TECHNICAL_PROJECT");
    await page.getByRole("button", { name: "Criar Serviço" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/services/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const serviceId = page.url().split("/").pop()!;

    // Navigate to service detail to create proposal
    await page.goto(`/services/${serviceId}`);
    await page.getByRole("link", { name: /criar proposta/i }).click();
    await page.waitForURL(`/proposals/new?serviceId=${serviceId}`, { timeout: 10000 });

    await page.getByLabel("Título *").fill(`${PREFIX} - Proposta`);
    await page.getByLabel("Valor Total").fill("10000");
    await page.getByLabel("Status").selectOption("SENT");
    await page.getByRole("button", { name: "Criar Proposta" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/proposals/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const proposalId = page.url().split("/").pop()!;

    // Navigate to proposal detail and add document
    await page.goto(`/proposals/${proposalId}`);
    await page.getByRole("link", { name: /adicionar documento/i }).click();
    await page.waitForURL(`/documents/new?serviceId=${serviceId}&proposalId=${proposalId}`, { timeout: 10000 });

    await page.getByLabel("Título *").fill(`${PREFIX} - Contrato`);
    await page.getByLabel("URL do Arquivo *").fill("https://exemplo.com/contrato.pdf");
    await page.getByRole("button", { name: "Adicionar Documento" }).click();

    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/documents/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });

    // Verify document is visible in proposal detail
    await page.goto(`/proposals/${proposalId}`);
    await expect(page.getByText(`${PREFIX} - Contrato`)).toBeVisible({ timeout: 5000 });
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/document-flow.spec.ts
git commit -m "test: add e2e tests for document flow"
```

---

### Task 9: Final verification gate

- [ ] **Step 1: Run all gates**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
git diff --check
```

Fix any issues found.

- [ ] **Step 2: Final commit if fixes needed, then status check**

```bash
git add -A
git status --short
```

If clean and all gates pass, no additional commit needed. Otherwise fix, commit, re-run gates.

---

## Summary of Files

| Action | File |
|--------|------|
| Modify | `prisma/schema.prisma` |
| Create | `prisma/migrations/XXX_add_proposal_id_to_document/` |
| Create | `src/features/documents/actions.ts` |
| Create | `src/features/documents/DocumentVisibilityBadge.tsx` |
| Create | `src/features/documents/DocumentForm.tsx` |
| Create | `src/features/documents/DocumentList.tsx` |
| Create | `src/features/documents/DocumentDetail.tsx` |
| Create | `src/app/(app)/documents/page.tsx` |
| Create | `src/app/(app)/documents/new/page.tsx` |
| Create | `src/app/(app)/documents/[documentId]/page.tsx` |
| Create | `src/app/(app)/documents/[documentId]/edit/page.tsx` |
| Modify | `src/app/(app)/services/[serviceId]/page.tsx` |
| Modify | `src/app/(app)/proposals/[proposalId]/page.tsx` |
| Modify | `scripts/seed-demo.ts` |
| Create | `tests/unit/features/documents/schema.test.ts` |
| Create | `tests/unit/features/documents/actions.test.ts` |
| Create | `tests/e2e/document-flow.spec.ts` |
| Create | `docs/superpowers/specs/2026-05-19-document-management-design.md` |
