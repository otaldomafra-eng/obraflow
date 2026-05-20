# Contratos - Design

## Problem

Services already show a contract count and proposals already relate to contracts, but users cannot create, view, or manage contracts. The `Contract` model exists in Prisma and should be used as-is for this slice.

## Scope

CRUD for contracts linked to services, optionally linked to a proposal. This version manages contract metadata only: number, status, service, proposal, signature date, and timestamps. It does not add file upload, signature workflow, monetary values, or contract text generation.

## Model

No migration is needed. The current model is authoritative:

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
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  service     Service   @relation(fields: [tenantId, serviceId], references: [tenantId, id], onDelete: Restrict)
  proposal    Proposal? @relation(fields: [tenantId, serviceId, proposalId], references: [tenantId, serviceId, id], onDelete: Restrict)

  @@unique([tenantId, id])
  @@unique([tenantId, number])
  @@unique([tenantId, externalKey])
  @@index([tenantId, serviceId])
  @@index([tenantId, serviceId, proposalId])
}
```

Important: `Contract` has no `title` field. Do not add or reference `title` in this implementation.

## Contract Number

Generate `number` on create and keep it non-editable. Format: `CT-00001`.

Use the highest existing numeric `CT-` suffix for the tenant plus one, not `count() + 1`, because deleted contracts can make `count() + 1` collide with an existing unique number. If create hits Prisma `P2002` for `[tenantId, number]`, retry generation a small number of times before surfacing the error.

## Statuses

| Value | Label | Color |
|---|---|---|
| `DRAFT` | Rascunho | zinc |
| `ISSUED` | Emitido | blue |
| `SIGNED` | Assinado | green |
| `COMPLETED` | Concluido | emerald |
| `CANCELLED` | Cancelado | rose |

Status stays as `String` in Prisma and is validated with Zod constants.

## Smart Timestamp

- Set `signedAt` automatically when status becomes `SIGNED` and `signedAt` is null.
- Clear `signedAt` when status leaves `SIGNED`.

## Routes

| Route | Purpose |
|---|---|
| `/contracts` | list with status/search filters |
| `/contracts/new` | create form, accepts `?serviceId=` and `?proposalId=` |
| `/contracts/[contractId]` | detail |
| `/contracts/[contractId]/edit` | edit status only |

## Feature Module

Create `src/features/contracts/`:

| File | Purpose |
|---|---|
| `actions.ts` | Zod schemas, CRUD, auto-numbering, smart timestamps, tenant-scoped assertions |
| `ContractForm.tsx` | create/edit form using service selection and status |
| `ContractList.tsx` | table/list with number, client, service, proposal, status, signedAt |
| `ContractDetail.tsx` | detail layout using `Contrato {number}` as the heading |
| `ContractStatusBadge.tsx` | PT-BR status badge |

## Integrations

- Sidebar: add `Contratos` to the `Comercial` group with `FileSignature`.
- Service detail: add a `Contratos` section below `Propostas` and above `Documentos`, plus CTA to `/contracts/new?serviceId=...`.
- Proposal detail: add a `Contratos` section filtered by `proposalId`, plus CTA to `/contracts/new?serviceId=...&proposalId=...`.
- Service stats: link the contract count to `/contracts?serviceId=...`.

## Seed Data

Add demo contracts after proposals are created and before documents if useful:

- one `SIGNED` contract linked to an accepted proposal;
- one `ISSUED` or `DRAFT` contract linked only to a service.

Cleanup must delete contracts before proposals/services.

## Testing

Unit tests:

- schema accepts serviceId/proposalId/status and rejects invalid status;
- update schema accepts status only and rejects number/service/proposal changes;
- create validates service ownership;
- create validates proposal belongs to the same service;
- number generation uses max existing `CT-` suffix;
- status transition sets/clears `signedAt`;
- list/get remain tenant-scoped.

E2E tests:

- create contract from `/contracts/new` and verify list/detail;
- create contract from service detail and verify service section;
- create contract from proposal detail and verify proposal section.

## Gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
git diff --check
```
