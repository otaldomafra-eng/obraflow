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

```bash
pnpm test:e2e
```
