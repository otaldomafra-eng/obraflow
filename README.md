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
pnpm db:setup
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

Start the local PostgreSQL container, wait for readiness, apply migrations, and
seed the demo tenant:

```bash
pnpm db:setup
```

Individual commands are also available:

```bash
pnpm db:up
pnpm db:wait
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:seed
```

## End-to-End Tests

### Prerequisites

E2E tests use the Docker PostgreSQL service on `localhost:55432`.

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
It also runs `pnpm db:setup` first, so the demo tenant and login user are recreated before the browser tests run.

> **Note:** E2E tests are excluded from `pnpm test` — only unit and integration tests run there.
