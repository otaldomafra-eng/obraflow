# Preparacao para Producao Inicial Gratuita - Plano de Implementacao

> **Para agentic workers:** executar task por task, com commits pequenos. Ler `AGENTS.md` antes de codar. Como o projeto usa Next.js 16, consultar `node_modules/next/dist/docs/` antes de alterar rotas, auth, middleware ou Server Actions.

**Goal:** permitir uso real inicial do ObraFlow em Vercel Hobby + Supabase Free, sem depender de login demo.

**Arquitetura:** manter NextAuth Credentials, adicionar senha hash no banco, criar setup do primeiro admin, proteger seeds e documentar envs.

**Tech Stack:** Next.js 16, NextAuth v4, Prisma, Supabase, Vercel, bcryptjs, Vitest, Playwright.

---

## Guardrails

- Nao registrar segredos.
- Nao alterar envs reais.
- Nao fazer deploy, push ou merge.
- Criar somente a migration de `User.passwordHash`.
- Nao implementar Google OAuth, convite, reset de senha ou gestao completa de usuarios.
- `/setup` deve criar apenas o primeiro ADMIN.

---

## Task 1: Adicionar passwordHash ao User

**Arquivos:**
- Modificar: `prisma/schema.prisma`
- Criar: `prisma/migrations/<timestamp>_add_user_password_hash/migration.sql`

**Implementacao:**

Adicionar ao model `User`:

```prisma
passwordHash String?
```

Gerar migration:

```bash
pnpm prisma migrate dev --name add_user_password_hash --create-only
pnpm exec prisma validate
```

**Verificacao:**

```bash
pnpm typecheck
pnpm exec prisma validate
```

**Commit:**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add password hash to users"
```

---

## Task 2: Adicionar bcryptjs e helpers de senha

**Arquivos:**
- Modificar: `package.json`
- Modificar: lockfile
- Criar: `src/server/auth/password.ts`
- Criar: `tests/unit/server/auth/password.test.ts`

**Implementacao:**

Instalar:

```bash
pnpm add bcryptjs
```

Criar `src/server/auth/password.ts`:

```ts
import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}
```

Testar:

- hash retorna string diferente da senha;
- senha correta valida;
- senha incorreta falha.

**Verificacao:**

```bash
pnpm test tests/unit/server/auth/password.test.ts
```

**Commit:**

```bash
git add package.json pnpm-lock.yaml src/server/auth/password.ts tests/unit/server/auth/password.test.ts
git commit -m "feat: add password hashing helpers"
```

---

## Task 3: Atualizar authorize para hash com fallback demo

**Arquivos:**
- Modificar: `src/server/auth/config.ts`
- Modificar: `tests/unit/server/auth/config.test.ts`

**Regra nova:**

1. Buscar user por email.
2. Se nao existir, retornar null.
3. Se user tem `passwordHash`, validar com `verifyPassword`.
4. Se user nao tem `passwordHash`, usar fallback demo apenas quando:
   - `NODE_ENV === "development"`, ou
   - `DEMO_LOGIN_ENABLED === "true"`.
5. Em producao real, usuario sem hash nao deve logar.

**Testes obrigatorios:**

- usuario com hash e senha correta loga;
- usuario com hash e senha errada falha;
- usuario sem hash nao loga em producao sem `DEMO_LOGIN_ENABLED`;
- fallback demo continua funcionando quando explicitamente habilitado.

**Verificacao:**

```bash
pnpm test tests/unit/server/auth/config.test.ts
```

**Commit:**

```bash
git add src/server/auth/config.ts tests/unit/server/auth/config.test.ts
git commit -m "fix: authenticate with password hash"
```

---

## Task 4: Criar setup do primeiro admin

**Arquivos:**
- Criar: `src/features/setup/actions.ts`
- Criar: `src/app/(auth)/setup/page.tsx`
- Criar: `src/app/(auth)/setup/SetupForm.tsx`
- Modificar: `src/proxy.ts`
- Criar testes em `tests/unit/features/setup/actions.test.ts`
- Criar testes em `tests/unit/app/setup/setup-page.test.tsx`

**Comportamento:**

- `/setup` e publica.
- Se ja existe membership ADMIN, redireciona para `/sign-in`.
- Se nao existe ADMIN, exibe formulario.
- Action cria:
  - tenant com `tenantName` e `tenantSlug`;
  - user com `name`, `email`, `passwordHash`;
  - membership ADMIN.
- Senha minima: 8 caracteres.
- Slug minimo: string nao vazia, lowercase/kebab-case se possivel.

**Middleware:**

Atualizar matcher para liberar `/setup`.

**Importante:**

Nao fazer E2E de `/setup` no banco compartilhado atual, porque `prisma/seed.ts` ja cria admin demo.

**Verificacao:**

```bash
pnpm test tests/unit/features/setup/actions.test.ts tests/unit/app/setup/setup-page.test.tsx
```

**Commit:**

```bash
git add src/features/setup src/app/(auth)/setup src/proxy.ts tests/unit/features/setup tests/unit/app/setup
git commit -m "feat: add first admin setup flow"
```

---

## Task 5: Proteger prisma seed

**Arquivos:**
- Modificar: `prisma/seed.ts`
- Criar/ajustar teste relevante em `tests/unit/config/local-setup.test.ts` ou teste dedicado

**Implementacao:**

No inicio do `main()`:

```ts
if (process.env.NODE_ENV === "production" && process.env.CONFIRM_PROD_SEED !== "1") {
  console.error("Refusing to seed a production database.");
  process.exit(1);
}
```

**Verificacao:**

- desenvolvimento continua permitido;
- producao sem `CONFIRM_PROD_SEED=1` bloqueia.

**Commit:**

```bash
git add prisma/seed.ts tests/unit/config/local-setup.test.ts
git commit -m "fix: guard seed in production"
```

---

## Task 6: Validar e documentar envs

**Arquivos:**
- Modificar: `src/lib/env.ts`
- Criar/atualizar: `.env.example`
- Criar/atualizar testes de env

**Regras:**

- Obrigatorias: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
- Recomendada apos setup: `DEFAULT_TENANT_SLUG`.
- Dev/demo only: `DEMO_LOGIN_ENABLED`, `DEMO_LOGIN_PASSWORD`.
- Nao exigir `AUTH_SECRET`.

**Exemplo `.env.example`:**

```env
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
DEFAULT_TENANT_SLUG=

# Development/demo only
# DEMO_LOGIN_ENABLED=true
# DEMO_LOGIN_PASSWORD=

# Future storage/AI
# S3_ENDPOINT=
# S3_REGION=
# S3_BUCKET=
# S3_ACCESS_KEY_ID=
# S3_SECRET_ACCESS_KEY=
# AI_PROVIDER=mock
# OPENAI_API_KEY=
```

**Commit:**

```bash
git add src/lib/env.ts .env.example tests/unit/config
git commit -m "docs: document production environment"
```

---

## Task 7: Criar clean-demo script

**Arquivos:**
- Criar: `scripts/clean-demo.ts`
- Modificar: `package.json` se adicionar script

**Comportamento:**

- Requer `CONFIRM_CLEAN_DEMO=1`.
- Aceita prefixo padrao `Demo Beta`.
- Remove dados demo na ordem correta de FKs.
- Nao remove dados reais sem prefixo.

**Commit:**

```bash
git add scripts/clean-demo.ts package.json
git commit -m "feat: add demo cleanup script"
```

---

## Task 8: Gates finais

Rodar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
git diff --check
```

Se qualquer gate falhar, corrigir antes de reportar.

---

## Decisoes Fechadas

- Usar `bcryptjs`.
- Manter Credentials Provider.
- Criar `/setup` somente para primeiro ADMIN.
- Senha minima de 8 caracteres.
- Criar migration apenas para `User.passwordHash`.
- Manter S3/AI comentados como futuro.
