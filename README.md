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

Set `DATABASE_URL` in `.env` to a Supabase PostgreSQL connection string before
running database commands or flows that read application data.

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

ObraFlow uses PostgreSQL through Supabase for development and test data. Create a
Supabase project for non-production work, then set `DATABASE_URL` in `.env`.

Use the Supavisor session pooler connection string for migrations and local
development. This avoids the direct Supabase database host, which is IPv6-only by
default and can fail on local networks or deploy providers that require IPv4:

```bash
DATABASE_URL="postgresql://postgres.fhtyhqvxwiajoctailir:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true"
```

For Vercel runtime, use the Supavisor transaction pooler on port `6543` in the
Vercel `DATABASE_URL` environment variable:

```bash
DATABASE_URL="postgresql://postgres.fhtyhqvxwiajoctailir:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require&uselibpqcompat=true"
```

After the environment is configured, generate Prisma Client, apply migrations,
and seed the demo tenant:

```bash
pnpm db:setup
```

Individual commands are also available:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:seed
```

## End-to-End Tests

### Prerequisites

E2E tests use the Supabase database configured by `DATABASE_URL`. Use a dedicated
development/test Supabase project because migrations and seed data are applied
outside production.

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
Run `pnpm db:setup` manually when migrations or seed data need to be refreshed.

> **Note:** E2E tests are excluded from `pnpm test` — only unit and integration tests run there.
