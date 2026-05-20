# Contratos — Design

## Problem

Services show a contract count stat, and proposals reference contracts via FK, but users cannot create, view, or manage contracts. The Contract model exists in Prisma but has no CRUD workflow, no routes, and no UI.

## Scope

Full CRUD for contracts linked to services (required) and optionally linked to a parent proposal. Auto-numbering on creation. Status lifecycle with smart `signedAt` timestamp.

## Model (existing — no migration needed)

```prisma
model Contract {
  id          String    @id @default(cuid())
  tenantId    String
  externalKey String?
  serviceId   String
  proposalId  String?
  number      String
  status      String    @default("DRAFT")
  signedAt    DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  service  Service  @relation(fields: [tenantId, serviceId], references: [tenantId, id], onDelete: Restrict)
  proposal Proposal? @relation(fields: [tenantId, serviceId, proposalId], references: [tenantId, serviceId, id], onDelete: Restrict)

  @@unique([tenantId, id])
  @@unique([tenantId, number])
  @@unique([tenantId, externalKey])
  @@index([tenantId, serviceId])
  @@index([tenantId, serviceId, proposalId])
}
```

### Contract Number

Auto-generated on create if not provided: `CT-{seq}` where seq is a zero-padded 5-digit number (e.g. `CT-00001`, `CT-00002`). Computed via `prisma.contract.count() + 1`.

Non-editable after creation — `number` not included in update schema.

### Statuses

| Value | Label | Color |
|---|---|---|
| `DRAFT` | Rascunho | zinc |
| `ISSUED` | Emitido | blue |
| `SIGNED` | Assinado | green |
| `COMPLETED` | Concluído | emerald |
| `CANCELLED` | Cancelado | rose |

### Smart timestamp

- `signedAt` set automatically when status → `SIGNED` and `signedAt` is null
- `signedAt` cleared when status leaves `SIGNED`

## Routes

| Route | Page | Purpose |
|---|---|---|
| `/contracts` | `contracts/page.tsx` | Listagem CRUD com filtros de status |
| `/contracts/new` | `contracts/new/page.tsx` | Criar contrato (aceita `?serviceId=` e `?proposalId=`) |
| `/contracts/[contractId]` | `contracts/[contractId]/page.tsx` | Detalhe do contrato |
| `/contracts/[contractId]/edit` | `contracts/[contractId]/edit/page.tsx` | Editar contrato |

## Feature Module: `src/features/contracts/`

| File | Purpose |
|---|---|
| `actions.ts` | Zod schemas, CRUD, auto-numbering, smart timestamps, tenant-scoped assertions |
| `ContractForm.tsx` | Client component, create + edit, `useActionState` + redirect |
| `ContractList.tsx` | Server-compatible table (number, service, client, status, signedAt, link) |
| `ContractDetail.tsx` | Detail card layout (service, proposal, client, status, number, dates, signedAt) |
| `ContractStatusBadge.tsx` | Color-coded status badge |

### Actions API

- `generateContractNumber(tenantId)` — returns next `CT-XXXXX`
- `createContract(tenantId, input)` — validates service + proposal (if provided) belong to tenant, generates number if not provided
- `updateContract(tenantId, contractId, input)` — no number/serviceId/proposalId change
- `listContracts(tenantId, filters)` — serviceId, proposalId, status, search
- `getContract(tenantId, contractId)` — single with service + proposal includes

### ProposalId Validation

If proposalId is provided in create, run `assertProposalBelongsToService(tenantId, serviceId, proposalId)` before insert.

## Sidebar

Add "Contratos" to the "Comercial" group in `SidebarNav.tsx`, between "Propostas" and "Projetos":

```ts
{ label: "Contratos", href: "/contracts", icon: FileSignature },
```

## Integrations

### Service Detail (`services/[serviceId]/page.tsx`)

Add "Contratos" section (below Propostas, above Documentos):
- Query contracts for the service
- Show compact list: number, status badge, signedAt
- CTA "Criar Contrato" → `/contracts/new?serviceId=xxx`
- Wire `service._count.contracts` stat to actual link

### Proposal Detail (`proposals/[proposalId]/page.tsx`)

Add "Contratos" section:
- Query contracts with matching `proposalId`
- Show compact list with CTA "Criar Contrato" → `/contracts/new?serviceId=xxx&proposalId=yyy`

## Seed Data

Add to `prisma/seed.ts` (or `scripts/seed-demo.ts`):
- 2-3 Contracts with Demo Beta prefix, varying statuses (DRAFT, ISSUED, SIGNED)
- At least one linked to an ACCEPTED proposal
- At least one without a proposal link
- Cleanup removes contracts before proposals (FK dependency ordering)

## Testing

### Unit tests

- Contract actions: create, list, update (with status transitions), tenant isolation
- Number auto-generation logic
- Status transition logic (signedAt auto-set/clear)

### E2E tests

- Login → `/contracts` → create contract (with service select) → verify in list
- Login → `/services` → open service → create contract → verify in detail section
- Login → `/proposals` → open proposal → verify linked contracts section

## Gates

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build && git diff --check
```
