# Session 1: PR #10 Post-Deploy — Demo Seed + Production Validation

**Date:** 2026-05-17 20:30 BRT  
**Branch:** `main` (PR #10 already merged at `a159f1a`)

## What was accomplished

### 1. Demo seed executed successfully
- **Problem:** `pnpm demo:seed` failed with PrismaPg `P1010` ("User was denied access on the database") when using DATABASE_URL from Vercel production env pull (redacted sensitive vars).
- **Root cause:** Vercel production environment variables are redacted for sensitive values. The `.env.local` and `.env.production` files pulled via `vercel env pull` contained `DATABASE_URL=""` (empty).
- **Solution:** The existing `.env` file already had a functional Supabase connection URL. Ran `pnpm demo:seed` against that database.
- **Data created:**
  - 3 clients (Ana Souza PF, Construtora Nova Era Ltda PJ, Carlos Pereira PF)
  - 3 properties (Condomínio Parque Verde, Residencial Nova Era, Casa Jardim das Flores)
  - 4 services (Reforma Residencial Completa, Aprovação de Projeto Residencial, Projeto Estrutural, Consultoria de Regularização)
  - 6 tasks
  - 4 work logs
- All records use prefix "Demo Beta" for safe identification and cleanup.

### 2. Production runtime validation (Playwright)
- Automated full-stack validation against `obraflow-brown.vercel.app`.
- **What passed (11/12 checks):**
  - ✅ /sign-in loads with form
  - ✅ Login with admin@obraflow.local / obraflow123 → /dashboard redirect
  - ✅ All 13 sidebar links present
  - ✅ /clients (with seeded Demo Beta records visible)
  - ✅ /properties (3 Demo Beta + 13 other records)
  - ✅ /services (4 Demo Beta + 36 other records)
  - ✅ Client detail page (Demo Beta Construtora Nova Era Ltda)
  - ✅ Property detail page (Demo Beta Condomínio Parque Verde)
  - ✅ Service detail page (Demo Beta Consultoria de Regularização)
  - ✅ Mobile viewport (sidebar + menu toggle)
  - ✅ Desktop screenshot captured
  - ℹ️ Task detail: not found on the first service detail (tasks require a specific service tab/navigation)

### 3. Bug fixes discovered during validation

#### Playwright CSS selector `[href!=value]` is invalid
- The selector `a[href^="/properties/"][href!="/properties/new"]` uses `!=` which is **not valid CSS**.
- Playwright's CSS engine silently fails to match elements with invalid selectors.
- **Fix:** Replaced with valid `:not()` pseudo-class: `a[href^="/properties/"]:not([href="/properties/new"])`.
- This resolved "No property detail link found" / "No service detail link found" issues.
- Validation script saved to `scripts/playwright-validate-prod.js` for reuse.

#### `.env.local` and `.env.production` block local builds
- Files created by `vercel env pull` contain `DATABASE_URL=""` (redacted).
- Next.js loads `.env.production` (in `next build`, NODE_ENV=production) and `.env.local` before `.env`, overriding the real DATABASE_URL.
- **Fix:** Deleted both files (they are in `.gitignore`). Real DATABASE_URL stays in `.env`.

#### Lint warning: unused variable
- `tests/unit/config/local-setup.test.ts` had an unused `supabaseDatabaseUrl` constant.
- **Fix:** Removed the unused variable.

## Gates verification (all passing)

| Gate | Result |
|------|--------|
| `pnpm lint` | ✅ Clean (0 errors, 0 warnings) |
| `pnpm typecheck` | ✅ Clean (tsc --noEmit) |
| `pnpm test` | ✅ 196 passed, 18 skipped |
| `pnpm build` | ✅ Compiled, 19 routes (static + dynamic) |

## Technical observations

- **Vercel + sensitive env vars:** Production environment variables marked as "sensitive" are redacted by `vercel env pull`. To seed production databases, use local `.env` with the real connection URL, or run seed commands via Vercel dashboard / Supabase SQL editor directly.
- **Demo seed idempotency:** The seed script is safe to re-run — it cleans existing "Demo Beta" records before creating new ones.
- **Validation script:** `BASE_URL`, `SCREENSHOT_DIR`, `EMAIL`, and `PASSWORD` are configurable via environment variables with sensible defaults.
- **Supabase pooler:** The DATABASE_URL uses Supabase's connection pooler with `&uselibpqcompat=true`, which is compatible with Prisma.

## What to do next

1. Review and merge this session's commit (validation script + session brief + lint fix).
2. Consider running `pnpm demo:seed` on a regular schedule or as part of release pipeline.
3. Add task detail navigation check when task pages become directly accessible from service detail.
4. Update `.env.example` if new environment variables are introduced.
