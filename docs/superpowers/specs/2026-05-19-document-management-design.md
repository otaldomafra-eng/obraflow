# Document Management — Design

## Problem
`/documents` is a sidebar link that leads nowhere. Services show a document count but users cannot create, view, or manage documents. Proposals and contracts need file attachments but there is no document workflow.

## Scope
CRUD for documents linked to services (required) and proposals (optional). URL-based file references only (no binary upload in this iteration).

## Model Changes

### Document (existing, extended)
```
+ proposalId   String?    // optional FK to Proposal
+ proposal     Proposal?  @relation(fields: [tenantId, serviceId, proposalId], references: [tenantId, serviceId, id])
+ @@index([tenantId, serviceId, proposalId])
```

Pattern matches Contract's existing proposalId FK exactly.

### Visibility Enum (no change)
```
INTERNAL, CLIENT_VISIBLE, SUPPLIER_VISIBLE
```

## Architecture

### Feature module: `src/features/documents/`
| File | Role |
|------|------|
| `actions.ts` | Zod schemas (create/update), CRUD with tenant assertion, proposalId validation |
| `DocumentForm.tsx` | useActionState + useSearchParams (server action pattern) |
| `DocumentList.tsx` | Server table for /documents list |
| `DocumentDetail.tsx` | Metadata card with external link |
| `DocumentVisibilityBadge.tsx` | Color-coded badge (3 values, PT-BR labels) |

### Routes
- `GET /documents` — list with search + visibility filter tabs
- `GET /documents/new` — create form (accepts `?serviceId=` and `?proposalId=`)
- `GET /documents/[id]` — detail with metadata + open link
- `GET /documents/[id]/edit` — edit form (service/proposal read-only)

### Integrations
- **Service detail** — new "Documentos" section below proposals, list + "Adicionar Documento" CTA
- **Proposal detail** — new "Documentos" section showing only docs with matching proposalId + CTA

### Actions
- `createDocument(tenantId, input)` — validates service + proposal (if provided) belong to tenant
- `updateDocument(tenantId, documentId, input)` — no serviceId/proposalId change on edit
- `listDocuments(tenantId, filters)` — serviceId, proposalId, visibility, search
- `getDocument(tenantId, documentId)` — single with service + proposal includes

### ProposalId Validation
If proposalId is provided in create, run `assertProposalBelongsToService(tenantId, serviceId, proposalId)` before insert. This ensures data integrity even though the FK enforces it at DB level.

### Seed Demo Data
3 documents:
- Memorial descritivo (PDF link) — linked to service + ACCEPTED proposal
- Contrato assinado (PDF link) — linked to service + SENT proposal
- Imagem de exemplo (JPG link) — linked to service only
- Cleanup removes documents before services (same pattern as proposals)

### PT-BR Visibility Labels
- INTERNAL → Interno
- CLIENT_VISIBLE → Visível ao Cliente
- SUPPLIER_VISIBLE → Visível ao Fornecedor
