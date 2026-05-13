# ObraFlow

ObraFlow is a Next.js application for engineering, architecture, and small construction operations. It is built around the core relationship model:

```text
Cliente -> Imovel/Empreendimento -> Servico
```

## Development

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## End-to-End Tests

### Prerequisites

E2E tests require a running PostgreSQL instance and a seeded database.

1. Start PostgreSQL on `localhost:5432`

2. Create the database and user:
   ```bash
   createdb obraflow
   createuser obraflow --password
   # use "obraflow" as password
   ```

3. Apply migrations and seed:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

### Run

Install Playwright browsers (one-time):

```bash
pnpm setup:e2e
```

Then run:

```bash
pnpm test:e2e
```

The `webServer` in `playwright.config.ts` automatically starts `pnpm dev`, so the dev server does not need to be started beforehand.

> **Note:** E2E tests are excluded from `pnpm test` — only unit and integration tests run there.
