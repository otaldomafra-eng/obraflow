# Secure Document Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real file upload via Supabase Storage while maintaining security by visibility level and retrocompatibility with external URLs.

**Architecture:** Server-side upload via Supabase Storage service role. Private bucket. Access controlled by authenticated routes (app) and portal token routes (portal). New metadata fields on Document model.

**Tech Stack:** Prisma (migration), Next.js 16 Server Actions + Route Handlers, Zod, Supabase Storage SDK, Vitest, Playwright

**Design Reference:** `docs/superpowers/specs/2026-05-21-secure-document-upload-design.md`

---

### Task 1: Prisma migration — Document metadata fields

**Files:**
- Modify: `prisma/schema.prisma` (Document model)

- [ ] **Step 1: Edit Document model in schema.prisma**

Add 4 new fields before the closing `@@` block:

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
  storagePath String?            // path no bucket, null = URL externa
  fileName    String?            // nome original sanitizado
  fileSize    Int?               // bytes
  uploadedAt  DateTime?          // timestamp do upload
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
pnpm prisma migrate dev --name add_document_storage_metadata --create-only
```

Verify generated SQL:
```sql
ALTER TABLE "Document" ADD COLUMN "storagePath" TEXT;
ALTER TABLE "Document" ADD COLUMN "fileName" TEXT;
ALTER TABLE "Document" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "Document" ADD COLUMN "uploadedAt" TIMESTAMP(3);
```

- [ ] **Step 3: Apply migration**

```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add storage metadata fields to Document model"
```

---

### Task 2: Server-only Supabase Storage client utility

**Files:**
- Create: `src/server/storage/supabase.ts`
- Create: `src/server/storage/types.ts`

- [ ] **Step 1: Create types**

```typescript
// src/server/storage/types.ts
export interface StorageUploadResult {
  path: string;
  size: number;
}

export interface StorageFile {
  name: string;
  size: number;
  mimeType: string | null;
  stream: ReadableStream<Uint8Array>;
}
```

- [ ] **Step 2: Create Supabase Storage client**

```typescript
// src/server/storage/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase storage configuration");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

export async function uploadFile(path: string, file: File): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return data.path;
}

export async function getFileStream(path: string): Promise<ReadableStream<Uint8Array>> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(path);

  if (error) throw new Error(`Storage download failed: ${error.message}`);
  return data.stream();
}

export async function getFileMetadata(path: string): Promise<{ size: number; mimeType: string | null }> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(path.split("/").slice(0, -1).join("/"), {
      search: path.split("/").pop(),
    });

  if (error || !data?.[0]) throw new Error(`File not found: ${path}`);
  return { size: data[0].size, mimeType: data[0].metadata?.mimetype ?? null };
}

export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([path]);

  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/server/storage/
git commit -m "feat: add Supabase Storage server utility"
```

---

### Task 3: File validation utility

**Files:**
- Create: `src/server/storage/validation.ts`
- Test: `tests/unit/server/storage/validation.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/server/storage/validation.test.ts
import { describe, expect, it } from "vitest";
import { validateFile, sanitizeFileName, buildStoragePath } from "@/server/storage/validation";

describe("file validation", () => {
  it("accepts valid PDF", () => {
    const result = validateFile({ name: "doc.pdf", size: 1_000_000, type: "application/pdf" });
    expect(result.ok).toBe(true);
  });

  it("rejects file over 10MB", () => {
    const result = validateFile({ name: "big.pdf", size: 11_000_000, type: "application/pdf" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("10MB");
  });

  it("rejects unsupported type", () => {
    const result = validateFile({ name: "script.exe", size: 1000, type: "application/x-msdownload" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("não suportado");
  });

  it("rejects MIME/extension mismatch", () => {
    const result = validateFile({ name: "doc.pdf", size: 1000, type: "image/png" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("inválido");
  });
});

describe("file name sanitization", () => {
  it("sanitizes special characters", () => {
    expect(sanitizeFileName("My Document (1).pdf")).toBe("my-document-1.pdf");
  });

  it("handles spaces and uppercase", () => {
    expect(sanitizeFileName("MEMORIAL DESCRITIVO.PDF")).toBe("memorial-descritivo.pdf");
  });

  it("preserves extension", () => {
    expect(sanitizeFileName("file.DOCX")).toBe("file.docx");
  });
});

describe("storage path building", () => {
  it("builds correct path", () => {
    const path = buildStoragePath("tenant-1", "service-1", "doc-1", "memorial.pdf");
    expect(path).toBe("tenant-1/service-1/doc-1-memorial.pdf");
  });
});
```

- [ ] **Step 2: Create validation utility**

```typescript
// src/server/storage/validation.ts
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/acad": [".dwg"],
  "application/dwg": [".dwg"],
  "application/autocad_dwg": [".dwg"],
  "image/vnd.dwg": [".dwg"],
};

export function validateFile(file: { name: string; size: number; type: string }): { ok: true } | { ok: false; error: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "Arquivo muito grande (máx. 10MB)" };
  }

  const allowedExtensions = ALLOWED_TYPES[file.type];
  if (!allowedExtensions) {
    return { ok: false, error: "Tipo de arquivo não suportado" };
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { ok: false, error: "Tipo de arquivo inválido" };
  }

  return { ok: true };
}

export function sanitizeFileName(name: string): string {
  const parts = name.split(".");
  const ext = parts.pop()?.toLowerCase() ?? "";
  const base = parts.join(".");

  const sanitized = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${sanitized}.${ext}`;
}

export function buildStoragePath(tenantId: string, serviceId: string, documentId: string, fileName: string): string {
  return `${tenantId}/${serviceId}/${documentId}-${fileName}`;
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm test tests/unit/server/storage/validation.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/server/storage/validation.ts tests/unit/server/storage/validation.test.ts
git commit -m "feat: add file validation and sanitization utilities"
```

---

### Task 4: Upload server action

**Files:**
- Modify: `src/features/documents/actions.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/features/documents/upload.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, uploadFileMock } = vi.hoisted(() => ({
  prismaMock: {
    document: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    service: { findUnique: vi.fn() },
  },
  uploadFileMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));
vi.mock("@/server/storage/supabase", () => ({ uploadFile: uploadFileMock }));

import { uploadDocument } from "@/features/documents/actions";

describe("uploadDocument", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("uploads file and creates document with storage metadata", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    uploadFileMock.mockResolvedValue("tenant-1/svc-1/doc-1-file.pdf");
    prismaMock.document.create.mockResolvedValue({
      id: "doc-1", tenantId: "t-1", serviceId: "svc-1",
      title: "Memorial", url: "/api/documents/doc-1/download",
      visibility: "INTERNAL", storagePath: "tenant-1/svc-1/doc-1-file.pdf",
      fileName: "file.pdf", fileSize: 1000,
    });

    const file = new File(["content"], "file.pdf", { type: "application/pdf" });
    const result = await uploadDocument("t-1", {
      serviceId: "svc-1", title: "Memorial", visibility: "INTERNAL", file,
    });

    expect(result.storagePath).toBe("tenant-1/svc-1/doc-1-file.pdf");
    expect(uploadFileMock).toHaveBeenCalled();
  });

  it("rejects when service does not belong to tenant", async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);
    const file = new File(["content"], "file.pdf", { type: "application/pdf" });
    await expect(
      uploadDocument("t-1", { serviceId: "svc-x", title: "Doc", visibility: "INTERNAL", file }),
    ).rejects.toThrow("does not belong to tenant");
  });
});
```

- [ ] **Step 2: Add upload action to actions.ts**

Add to `src/features/documents/actions.ts`:

```typescript
import { uploadFile } from "@/server/storage/supabase";
import { validateFile, sanitizeFileName, buildStoragePath } from "@/server/storage/validation";

export interface UploadDocumentInput {
  serviceId: string;
  proposalId?: string;
  title: string;
  visibility: "INTERNAL" | "CLIENT_VISIBLE" | "SUPPLIER_VISIBLE";
  file: File;
}

export async function uploadDocument(tenantId: string, input: UploadDocumentInput) {
  // Validate file
  const validation = validateFile({
    name: input.file.name,
    size: input.file.size,
    type: input.file.type,
  });
  if (!validation.ok) throw new Error(validation.error);

  // Assert service belongs to tenant
  await assertServiceBelongsToTenant(tenantId, input.serviceId);

  // Sanitize file name
  const safeName = sanitizeFileName(input.file.name);

  // Create document record first
  const document = await prisma.document.create({
    data: {
      tenantId,
      serviceId: input.serviceId,
      proposalId: input.proposalId ?? null,
      title: input.title,
      url: "/api/documents/PENDING/download", // placeholder
      visibility: input.visibility,
      mimeType: input.file.type,
    },
  });

  // Build storage path
  const storagePath = buildStoragePath(tenantId, input.serviceId, document.id, safeName);

  // Upload to Supabase Storage
  await uploadFile(storagePath, input.file);

  // Update document with storage metadata
  return prisma.document.update({
    where: { tenantId_id: { tenantId, id: document.id } },
    data: {
      storagePath,
      fileName: safeName,
      fileSize: input.file.size,
      uploadedAt: new Date(),
      url: `/api/documents/${document.id}/download`,
    },
  });
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm test tests/unit/features/documents/upload.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/documents/actions.ts tests/unit/features/documents/upload.test.ts
git commit -m "feat: add uploadDocument server action"
```

---

### Task 5: Adjust DocumentForm — upload + URL external

**Files:**
- Modify: `src/features/documents/DocumentForm.tsx`

- [ ] **Step 1: Update DocumentForm**

Add a toggle between "Upload de arquivo" and "URL externa". When upload is selected, show file input. When URL is selected, show URL input (current behavior).

Key changes:
- Add `mode` state: `"upload" | "url"` (default: `"url"` for retrocompatibility)
- When `mode === "upload"`: show file input with drag-drop area
- When `mode === "url"`: show existing URL input
- Accept both modes in the form action

```tsx
// Key additions to DocumentForm:
const [mode, setMode] = useState<"upload" | "url">(doc?.storagePath ? "upload" : "url");
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [uploadError, setUploadError] = useState<string | null>(null);

// Toggle buttons:
<div className="flex gap-2 mb-4">
  <button type="button" onClick={() => setMode("url")}
    className={`px-3 py-1.5 text-sm rounded-lg border ${mode === "url" ? "bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600"}`}>
    URL externa
  </button>
  <button type="button" onClick={() => setMode("upload")}
    className={`px-3 py-1.5 text-sm rounded-lg border ${mode === "upload" ? "bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600"}`}>
    Upload de arquivo
  </button>
</div>

// File input (when mode === "upload"):
<input type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.dwg"
  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
<p className="text-xs text-zinc-400">PDF, PNG, JPG, DOCX, XLSX, DWG — máx. 10MB</p>
```

- [ ] **Step 2: Commit**

```bash
git add src/features/documents/DocumentForm.tsx
git commit -m "feat: add upload toggle to DocumentForm"
```

---

### Task 6: Secure download route for authenticated app

**Files:**
- Create: `src/app/api/documents/[documentId]/download/route.ts`
- Test: `tests/unit/api/documents/download.test.ts`

- [ ] **Step 1: Create download route handler**

```typescript
// src/app/api/documents/[documentId]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/config";
import { prisma } from "@/server/db/client";
import { getFileStream } from "@/server/storage/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const tenantId = session.user.tenantId;

  const doc = await prisma.document.findFirst({
    where: { tenantId, id: documentId },
    select: { storagePath: true, fileName: true, mimeType: true, visibility: true },
  });

  if (!doc?.storagePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const stream = await getFileStream(doc.storagePath);
    const headers = new Headers();
    headers.set("Content-Type", doc.mimeType ?? "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${doc.fileName ?? "file"}"`);

    return new NextResponse(stream, { headers });
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write unit tests**

Test authorization: user without tenantId → 401, user with wrong tenantId → 403, user with correct tenantId → 200.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/documents/ tests/unit/api/documents/
git commit -m "feat: add secure download route for authenticated users"
```

---

### Task 7: Portal download route for CLIENT_VISIBLE documents

**Files:**
- Create: `src/app/api/documents/[documentId]/portal-download/route.ts`
- Test: `tests/unit/api/documents/portal-download.test.ts`

- [ ] **Step 1: Create portal download route handler**

```typescript
// src/app/api/documents/[documentId]/portal-download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getFileStream } from "@/server/storage/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Find service by portal token
  const service = await prisma.service.findUnique({
    where: { portalToken: token },
    select: { id: true, portalEnabled: true },
  });

  if (!service?.portalEnabled) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  // Find document: must be CLIENT_VISIBLE and belong to the service
  const doc = await prisma.document.findFirst({
    where: {
      id: documentId,
      serviceId: service.id,
      visibility: "CLIENT_VISIBLE",
    },
    select: { storagePath: true, fileName: true, mimeType: true },
  });

  if (!doc?.storagePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const stream = await getFileStream(doc.storagePath);
    const headers = new Headers();
    headers.set("Content-Type", doc.mimeType ?? "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${doc.fileName ?? "file"}"`);

    return new NextResponse(stream, { headers });
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write unit tests**

Test: missing token → 400, invalid token → 404, INTERNAL document → 404, CLIENT_VISIBLE document → 200.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/documents/ tests/unit/api/documents/
git commit -m "feat: add portal download route for CLIENT_VISIBLE documents"
```

---

### Task 8: Adjust DocumentDetail — preview for internal uploads

**Files:**
- Modify: `src/features/documents/DocumentDetail.tsx`

- [ ] **Step 1: Update DocumentDetail**

Detect if document is internal upload (`storagePath` present) vs external URL.

For internal uploads:
- PDF: show `<iframe src="/api/documents/{id}/download">` or download link
- Image: show `<img src="/api/documents/{id}/download">`
- Other: show download link

For external URLs:
- Keep existing behavior (external link)

```tsx
// Key changes in DocumentDetail:
const isInternalUpload = !!doc.storagePath;
const downloadUrl = isInternalUpload ? `/api/documents/${doc.id}/download` : doc.url;
const isPdf = doc.mimeType === "application/pdf";
const isImage = doc.mimeType?.startsWith("image/");

// Preview section:
{isInternalUpload && isPdf && (
  <div className="rounded-xl border border-zinc-200 bg-white p-6">
    <h2 className="mb-4 text-base font-semibold">Preview</h2>
    <iframe src={downloadUrl} className="w-full h-96 border rounded-lg" />
  </div>
)}

{isInternalUpload && isImage && (
  <div className="rounded-xl border border-zinc-200 bg-white p-6">
    <h2 className="mb-4 text-base font-semibold">Preview</h2>
    <img src={downloadUrl} alt={doc.title} className="max-w-full rounded-lg border" />
  </div>
)}

// Update "Abrir Arquivo" button:
<a href={downloadUrl} target="_blank" rel="noopener noreferrer">
  {isInternalUpload ? "Baixar Arquivo →" : "Abrir Arquivo →"}
</a>

// Show file size if available:
{doc.fileSize && (
  <div>
    <dt>Tamanho</dt>
    <dd>{(doc.fileSize / 1024).toFixed(1)} KB</dd>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/documents/DocumentDetail.tsx
git commit -m "feat: add preview support for internal uploads in DocumentDetail"
```

---

### Task 9: Adjust Portal — secure document links

**Files:**
- Modify: `src/app/(portal)/portal/[token]/page.tsx`

- [ ] **Step 1: Update portal document links**

Replace external `href={doc.url}` with portal download route:

```tsx
// In the portal page document list:
{service.documents.map((doc) => {
  const docUrl = doc.storagePath
    ? `/api/documents/${doc.id}/portal-download?token=${token}`
    : doc.url;
  return (
    <li key={doc.id}>
      <a href={docUrl} target="_blank" rel="noopener noreferrer">
        <span>{doc.title}</span>
        <span>Abrir →</span>
      </a>
    </li>
  );
})}
```

- [ ] **Step 2: Ensure getPortalService returns storagePath**

Update the `select` in `getPortalService` to include `storagePath`:

```typescript
documents: {
  where: { visibility: "CLIENT_VISIBLE" },
  select: { id: true, title: true, url: true, mimeType: true, storagePath: true },
  orderBy: { createdAt: "desc" },
},
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(portal)/portal/[token]/page.tsx src/features/services/actions.ts
git commit -m "feat: use secure download links in client portal"
```

---

### Task 10: Seed/demo — maintain external URL compatibility

**Files:**
- Verify: `prisma/seed.ts`

- [ ] **Step 1: Verify seed maintains external URLs**

The existing seed creates documents with external URLs. These should remain unchanged — `storagePath` will be `null`, and the existing URL-based flow continues to work.

No changes needed to seed. Verify by running:
```bash
pnpm db:seed
```

- [ ] **Step 2: Commit (if any changes)**

```bash
git commit -m "chore: verify seed compatibility with storage metadata"
```

---

### Task 11: Unit tests — comprehensive coverage

**Files:**
- Create/modify: `tests/unit/features/documents/upload.test.ts`
- Create: `tests/unit/server/storage/supabase.test.ts`
- Create: `tests/unit/api/documents/download.test.ts`
- Create: `tests/unit/api/documents/portal-download.test.ts`

- [ ] **Step 1: Storage client tests**

Test uploadFile, getFileStream, deleteFile with mocked Supabase client.

- [ ] **Step 2: Download route tests**

Test authorization flow: no session → 401, wrong tenant → 403, correct tenant → 200.

- [ ] **Step 3: Portal download tests**

Test: missing token → 400, invalid token → 404, INTERNAL doc → 404, CLIENT_VISIBLE doc → 200, disabled portal → 404.

- [ ] **Step 4: Run all unit tests**

```bash
pnpm test
```

Expected: All pass (296+ existing + new tests)

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "test: add unit tests for storage, download, and portal-download"
```

---

### Task 12: E2E tests — upload and portal flow

**Files:**
- Modify: `tests/e2e/document-flow.spec.ts`
- Modify: `tests/e2e/portal-flow.spec.ts`

- [ ] **Step 1: Add upload E2E test**

```typescript
// tests/e2e/document-flow.spec.ts — new test
test("faz upload de PDF e visualiza no detalhe", async ({ page }) => {
  test.setTimeout(90000);

  // Login
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("admin@obraflow.local");
  await page.getByLabel("Senha").fill("obraflow123");
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("/dashboard", { timeout: 15000 });

  // Navigate to document creation
  await page.goto("/documents/new");

  // Switch to upload mode
  await page.getByRole("button", { name: /upload de arquivo/i }).click();

  // Create a small PDF file in the test
  const pdfContent = Buffer.from("%PDF-1.4 test content");
  await page.setInputFiles('input[type="file"]', {
    name: "test-document.pdf",
    mimeType: "application/pdf",
    buffer: pdfContent,
  });

  // Fill form
  await page.getByLabel("Título *").fill(`${PREFIX} - PDF Upload`);
  await page.getByLabel("Visibilidade").selectOption("CLIENT_VISIBLE");
  await page.getByRole("button", { name: "Adicionar Documento" }).click();

  // Wait for redirect
  await page.waitForFunction(() => {
    return window.location.pathname.startsWith("/documents/") && !window.location.pathname.endsWith("/new");
  }, { timeout: 15000 });

  // Verify document detail shows upload info
  await expect(page.getByRole("heading", { name: `${PREFIX} - PDF Upload` })).toBeVisible();
  await expect(page.getByText("Baixar Arquivo")).toBeVisible();
});
```

- [ ] **Step 2: Add portal document access E2E test**

Extend `tests/e2e/portal-flow.spec.ts` to verify:
- Portal shows document with secure link
- Clicking document link downloads/opens file
- INTERNAL document not accessible via portal

- [ ] **Step 3: Run E2E tests**

```bash
pnpm exec playwright test --reporter=list
```

Expected: All 15+ tests pass

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/
git commit -m "test: add E2E tests for upload and portal document access"
```

---

### Task 13: Final gates

- [ ] **Step 1: Run all gates**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright test --reporter=list
git diff --check
```

- [ ] **Step 2: Fix any issues**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: finalize secure document upload block"
```

---

### Task 14: Environment documentation

**Files:**
- Create: `.env.example` (update if needed)

- [ ] **Step 1: Document required env vars**

Add to `.env.example` if not present:
```
# Supabase Storage (server-only)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_STORAGE_BUCKET="documents"
```

**Important:** `SUPABASE_SERVICE_ROLE_KEY` must NOT have `NEXT_PUBLIC_` prefix.

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add Supabase Storage env vars to .env.example"
```

---

## Summary

| Task | Files | Type |
|------|-------|------|
| 1. Migration | `schema.prisma`, migrations | Schema |
| 2. Storage client | `src/server/storage/supabase.ts`, `types.ts` | Utility |
| 3. Validation | `src/server/storage/validation.ts`, tests | Utility + Test |
| 4. Upload action | `src/features/documents/actions.ts`, tests | Action + Test |
| 5. DocumentForm | `src/features/documents/DocumentForm.tsx` | UI |
| 6. Download route | `src/app/api/documents/[id]/download/route.ts`, tests | Route + Test |
| 7. Portal download | `src/app/api/documents/[id]/portal-download/route.ts`, tests | Route + Test |
| 8. DocumentDetail | `src/features/documents/DocumentDetail.tsx` | UI |
| 9. Portal page | `src/app/(portal)/portal/[token]/page.tsx` | UI |
| 10. Seed | `prisma/seed.ts` (verify) | Data |
| 11. Unit tests | Multiple test files | Test |
| 12. E2E tests | `tests/e2e/document-flow.spec.ts`, `portal-flow.spec.ts` | Test |
| 13. Gates | All | Verification |
| 14. Env docs | `.env.example` | Docs |
