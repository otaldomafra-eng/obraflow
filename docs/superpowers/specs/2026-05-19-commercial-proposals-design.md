# Comercial e Propostas — Design

## Status

Approved. Ready for implementation.

## Schema Changes

Migration adds to `Proposal` model:

| Field | Type | Notes |
|---|---|---|
| `validUntil` | `DateTime?` | Validade da proposta |
| `notes` | `String?` | Observações/escopo resumido |

`status` stays as plain `String` (no Prisma enum). Validated via Zod constants:

```typescript
const PROPOSAL_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELED"] as const;
```

### Smart timestamps

- `sentAt` set automatically when status → `SENT` and `sentAt` is null
- `acceptedAt` set automatically when status → `ACCEPTED` and `acceptedAt` is null
- `acceptedAt` cleared when status leaves `ACCEPTED` (avoid contradictory state)

## Routes

| Route | Page | Purpose |
|---|---|---|
| `/commercial` | `commercial/page.tsx` | Dashboard/pipeline comercial |
| `/proposals` | `proposals/page.tsx` | Listagem CRUD com filtros |
| `/proposals/new` | `proposals/new/page.tsx` | Criar proposta |
| `/proposals/[proposalId]` | `proposals/[proposalId]/page.tsx` | Detalhe da proposta |
| `/proposals/[proposalId]/edit` | `proposals/[proposalId]/edit/page.tsx` | Editar proposta |

## Feature Modules

### `src/features/proposals/`

| File | Purpose |
|---|---|
| `actions.ts` | Zod schemas, CRUD, list/get, tenant-scoped assertions |
| `ProposalForm.tsx` | Client component, create + edit, useActionState + redirect |
| `ProposalList.tsx` | Server-compatible table (title, client, service, status, value, validUntil, link) |
| `ProposalDetail.tsx` | Detail card layout (client, property, service, status, value, dates, notes) |
| `ProposalStatusBadge.tsx` | Color-coded status badge |

### `src/features/commercial/`

| File | Purpose |
|---|---|
| `actions.ts` | `getCommercialMetrics()` — aggregated queries over Proposal |

## Page Designs

### `/commercial` — Dashboard

- Metric cards: total proposals, open value, accepted value, sent count, accepted count, rejected/canceled count, expired count
- Recent/open proposals list with links to `/proposals/[id]`
- CTA to `/proposals`

### `/proposals` — List

- Table: title, client name, service title, status badge, totalAmount, validUntil, action (abrir)
- Search by title, filter by status dropdown
- "Nova Proposta" button → `/proposals/new`
- Pagination if needed (not required for v1)

### `/proposals/new` — Create

- Form with: service selector (blocked if `?serviceId=`), title, totalAmount, status (default DRAFT), validUntil, notes
- Submit → server action → revalidatePath → redirect to `/proposals/[id]`
- Same `ProposalForm` component used for create and edit

### `/proposals/[proposalId]` — Detail

- Client name, property name (from service), service title, status badge, totalAmount, validUntil, sentAt, acceptedAt, notes
- Actions: Editar, Voltar ao serviço, Voltar para propostas

### `/proposals/[proposalId]/edit` — Edit

- Same `ProposalForm` with pre-filled data
- Submit → redirect to detail

## Integration with Service Detail

- Add "Propostas" section to `services/[serviceId]/page.tsx`
- Query proposals for the service
- Show compact list: title, status badge, value, validUntil
- CTA "Criar Proposta" → `/proposals/new?serviceId=xxx`
- Wire `service._count.proposals` stat to actual link

## Seed Data

Add to `scripts/seed-demo.ts`:

- 2-3 Proposals with Demo Beta prefix, varying statuses (DRAFT, SENT, ACCEPTED), linked to existing Demo Beta services
- At least one with validUntil in the future, one with validUntil in the past (expired)

## Testing

### Unit tests

- Proposal actions: create, list, update (with status transitions), tenant isolation
- Status transition logic (sentAt, acceptedAt auto-set/clear)

### E2E tests

- Login → `/services` → open service → create proposal → detail → edit status → verify
- Login → `/proposals` → create proposal (with service select) → verify in list

## Gates

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e && git diff --check
```
