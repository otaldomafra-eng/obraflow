# Deploy Inicial Gratuito e Configuracao de Producao - Plano de Implementacao

> **Para agentic workers:** Este bloco e de **planejamento e documentacao apenas**. Nenhum deploy deve ser executado. Nao alterar codigo de producao. Nao criar migrations. Nao mexer em secrets.

**Goal:** Implantar o ObraFlow em Vercel Hobby + Supabase Free com subdominio proprio, seguindo procedimento manual documentado.

**Arquitetura:** Next.js 16 server-side na Vercel, Prisma + Supavisor pooler para Supabase, autenticacao por Credentials + passwordHash, /setup para primeiro admin.

**Tech Stack:** Vercel Hobby, Supabase Free, Next.js 16, NextAuth v4, Prisma, bcryptjs.

---

## Guardrails

- Nao alterar codigo de producao neste bloco.
- Nao rodar deploy, push ou merge.
- Nao criar migrations.
- Nao mexer em secrets reais.
- Nao registrar dominios.
- Apenas documentacao e planejamento.

---

## Visao Geral do Fluxo de Deploy

```
1. Revisar status do Git e decidir push de main
2. Validar README publico e ausencia de secrets
3. Configurar projeto na Vercel (importar repo)
4. Configurar env vars na Vercel
5. Configurar dominio/subdominio na Vercel + DNS
6. Rodar migrations em producao (pnpm db:deploy)
7. Acessar /setup e criar primeiro admin
8. Definir DEFAULT_TENANT_SLUG apos setup
9. Rodar smoke test em producao
10. Documentar operacao inicial
```

---

## Task 1: Revisar Status do Git e Decidir Push de Main

**Descricao:** Antes de conectar o repositorio a Vercel, verificar se a branch main esta pronta para deploy.

**Checklist:**
- [ ] `git status` — working tree limpo.
- [ ] `git log --oneline origin/main..HEAD` — commits pendentes revisados.
- [ ] `git diff origin/main..HEAD --stat` — arquivos alterados. Nenhum arquivo de `.env` ou `.vercel` incluido.
- [ ] Decidir: fazer push direto para main, ou criar PR e merge apos revisao.

**Risco:** Se houver alteracoes nao testadas, o deploy pode quebrar.

**Comando:**
```bash
git status --short
git log --oneline origin/main..HEAD
git diff origin/main..HEAD --stat
```

---

## Task 2: Validar README Publico e Ausencia de Secrets

**Descricao:** Garantir que o repositorio publico nao exponha secrets.

**Arquivos:**
- `.gitignore` — deve ignorar `.env`, `.vercel`, `.next`, `*.local`.
- `.env.example` — nao deve conter valores reais.
- `README.md` — nao deve conter URLs reais de banco ou servico.

**Checklist:**
- [ ] `.gitignore` contem `.env` e `.vercel`.
- [ ] `.env.example` usa placeholders, nunca valores reais.
- [ ] `README.md` nao contem URLs de banco, apenas `POOLER_HOST` e `<PROJECT_REF>`.
- [ ] Nenhum arquivo `.env` versionado (`git ls-files | grep .env`).
- [ ] Nenhum arquivo com secrets no staging (`git status --short`).

**Comandos:**
```bash
git ls-files | grep -E "\.env$"
git ls-files | grep -E "\.local$"
grep -r "aws-1-us-west-2" README.md .env.example
```

---

## Task 3: Configurar Projeto na Vercel

**Descricao:** Conectar o repositorio GitHub a Vercel Hobby.

**Passos:**

1. Acessar https://vercel.com/new.
2. Importar repositorio `obraflow/obraflow` (ou nome correto).
3. Framework: Next.js (autodetectado).
4. Root directory: `./` (padrao).
5. Build command: `pnpm build` (ou o detectado).
6. Output directory: `.next` (padrao).
7. Environment variables: pular por enquanto (serao configuradas na Task 4).
8. Deploy: nao clicar em "Deploy" ainda.

**Observacoes:**
- O build command `pnpm build` no `package.json` ja executa `prisma generate && next build`. Isso funciona na Vercel, mas o Prisma Client sera gerado com as variaveis de ambiente da build. Importante: `DATABASE_URL` nao precisa estar presente no build time para Next.js (apenas para `prisma generate`). Se `prisma generate` falhar sem `DATABASE_URL`, usar `DATABASE_URL` dummy ou `PRISMA_GENERATE_DATABASE_URL` como workaround.
- A Vercel Hobby nao suporta `output: "standalone"`. Manter configuracao atual.

**Arquivos:**
- `vercel.json` — deve existir na raiz (ja existe). Verificar se precisa de ajustes:
  ```json
  {
    "buildCommand": "pnpm build",
    "framework": "nextjs",
    "installCommand": "pnpm install"
  }
  ```

**Tambem verificar:**
- `prisma.config.ts` — se usa `requireEnv("DATABASE_URL")`, pode falhar no build time. Verificar se o arquivo e executado durante `prisma generate`. Se sim, `DATABASE_URL` precisara estar disponivel no build time.

---

## Task 4: Configurar Env Vars na Vercel

**Descricao:** Adicionar as variaveis de ambiente obrigatorias no dashboard da Vercel.

**Variaveis a configurar (Production):**

| Variavel | Como obter |
|---|---|
| `DATABASE_URL` | Connection string do Supabase Free (transaction pooler porta 6543) |
| `NEXTAUTH_URL` | `https://<projeto>.vercel.app` (ou dominio personalizado depois) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` no terminal local |
| `DEFAULT_TENANT_SLUG` | Deixar vazio por enquanto; definir apos /setup |
| `AI_PROVIDER` | `mock` |
| `PRISMA_GENERATE_DATABASE_URL` | (Opcional) URL dummy caso `prisma generate` exija DATABASE_URL no build time |

**Variaveis que NAO devem ser configuradas:**
- `DEMO_LOGIN_ENABLED` — ausente = false
- `DEMO_LOGIN_PASSWORD` — ausente = sem fallback
- `OPENAI_API_KEY` — ainda nao implementado

**Importante:**
- Marcar todas como "Production" (nao "Preview" ou "Development").
- As envs de Preview podem replicar as de Production ou usar um banco separado.
- Nao copiar envs para o codigo. Usar apenas o dashboard da Vercel.

---

## Task 5: Configurar Dominio/Subdominio

**Descricao:** Apontar um subdominio proprio para a Vercel.

**Opcoes de Dominio:**

| Opcao | Custo | Complexidade |
|---|---|---|
| `obraflow.vercel.app` | Gratis | Nenhuma (ja incluso no Hobby) |
| `app.obraflow.com.br` | ~R$ 40/ano | Registrar dominio, configurar DNS |
| `obraflow.eng.br` | ~R$ 60/ano | Registrar dominio, configurar DNS |
| `escritorio.seudominio.com` | Ja possui | Apenas configurar DNS |

**Passos para dominio personalizado:**

1. Comprar dominio (se necessario) em registro .br, Cloudflare, ou similar.
2. No dashboard da Vercel > Project > Settings > Domains.
3. Adicionar dominio: `app.obraflow.com.br` (exemplo).
4. Vercel exibira as instrucoes de DNS:
   - Type: CNAME
   - Name: `app` (ou `@`)
   - Target: `cname.vercel.com`
   - (Ou A records para IPs Vercel se apex domain)
5. No painel DNS do provedor, criar o registro.
6. Aguardar propagacao (alguns minutos a horas).
7. SSL gerado automaticamente pela Vercel (certificado Lets Encrypt).
8. Apos SSL ativo, atualizar `NEXTAUTH_URL` para o novo dominio.

**Observacao:** Se ainda nao tiver dominio, comecar com `obraflow.vercel.app` e planejar dominio proprio. O `NEXTAUTH_URL` pode ser alterado depois sem perder sessoes (novo login sera necessario).

---

## Task 6: Rodar Migrations em Producao

**Descricao:** Aplicar as migrations do Prisma ao banco Supabase de producao.

**Comando:**
```bash
pnpm db:deploy
```

**Pre-requisitos:**
- `DATABASE_URL` apontando para o Supabase de producao (transaction pooler, porta 6543).
- `NODE_ENV` NAO precisa ser "production" para rodar migrations.

**Checklist de seguranca:**
- [ ] O banco de producao esta vazio (sem dados reais ainda).
- [ ] Backup exportado antes de rodar (opcional, banco vazio).
- [ ] Migration mais recente `20260520100000_add_user_password_hash` sera aplicada.
- [ ] Apos migrations, verificar tabelas no dashboard do Supabase.

**Comando de verificacao apos deploy:**
```bash
pnpm exec prisma validate
pnpm exec prisma db push --dry-run  # verifica se schema esta sincronizado
```

---

## Task 7: Acessar /setup e Criar Primeiro Admin

**Descricao:** Acessar a rota publica /setup no dominio de producao para criar o primeiro administrador.

**Passos:**

1. Abrir `https://<dominio>/setup`.
2. Preencher formulario:
   - Nome: nome do admin responsavel.
   - Email: email real (sera usado para login).
   - Senha: minimo 8 caracteres, escolher senha forte.
   - Nome do escritorio: razao social ou nome fantasia.
   - Slug do escritorio: identificador unico (ex: `meu-escritorio`).
3. Submeter formulario.
4. Sistema redireciona para `/sign-in`.
5. Fazer login com o email e senha cadastrados.
6. Verificar acesso ao dashboard.

**Verificacao:**
- Login funciona com as credenciais criadas.
- Tenant foi criado com o slug fornecido.
- Membership ADMIN foi criada.
- Tentar acessar `/setup` novamente — deve redirecionar para `/sign-in`.

---

## Task 8: Definir DEFAULT_TENANT_SLUG Apos Setup

**Descricao:** Apos criar o primeiro admin e tenant via /setup, configurar `DEFAULT_TENANT_SLUG` na Vercel para que o JWT callback resolva o tenantId automaticamente.

**Passos:**

1. No dashboard da Vercel > Project > Settings > Environment Variables.
2. Adicionar `DEFAULT_TENANT_SLUG` com o valor do slug criado em Task 7.
3. Marcar como "Production".
4. Fazer redeploy (ou a Vercel pode reiniciar automaticamente).
5. Apos redeploy, verificar se o login ainda funciona e o tenantId e resolvido.

**Por que isso e necessario:**
O JWT callback em `src/server/auth/config.ts` usa `DEFAULT_TENANT_SLUG` para buscar o tenantId e incluir no token JWT. Sem essa env, o callback tenta auto-detectar (funciona se houver apenas 1 membership). Com a env, e explicito e seguro.

---

## Task 9: Rodar Smoke Test em Producao

**Descricao:** Verificar se as funcionalidades basicas funcionam no ambiente de producao.

**Checklist:**

- [ ] `/sign-in` carrega sem erros.
- [ ] Login com admin criado via /setup funciona e redireciona para `/dashboard`.
- [ ] `/dashboard` carrega com dados (vazio, sem dados demo).
- [ ] Criar cliente (pessoa fisica/juridica).
- [ ] Criar imovel associado ao cliente.
- [ ] Criar servico associado ao imovel.
- [ ] Navegar para cada pagina do menu lateral.
- [ ] `/contracts`, `/proposals`, `/documents` carregam sem erros.
- [ ] Logout funciona (redireciona para `/sign-in`).
- [ ] Login com senha incorreta exibe erro.
- [ ] Acessar `/setup` apos admin criado redireciona para `/sign-in`.
- [ ] Acessar `/api/auth/providers` retorna JSON (nao HTML).
- [ ] Verificar que `DEMO_LOGIN_ENABLED` nao esta habilitado: login com `admin@obraflow.local` + `obraflow123` deve falhar.

**Em caso de erro:**
- Verificar logs no dashboard da Vercel (Function Logs).
- Verificar Supabase Logs no dashboard do Supabase.

---

## Task 10: Documentar Operacao Inicial

**Descricao:** Registrar as informacoes operacionais em local seguro (Obsidian, Notion, ou docs internas).

**O que documentar:**
- URL de producao e subdominio.
- Provedor DNS e credenciais de acesso.
- Email e provedor do registro de dominio.
- `NEXTAUTH_SECRET` (guardado em cofre de senhas, nunca no codigo).
- `DATABASE_URL` do pooler (guardado em cofre de senhas).
- Procedimento de backup manual.
- Procedimento de rollback (Task "Rollback e Recuperacao" do spec).
- Data do primeiro deploy e primeiro admin criado.
- Quem tem acesso ao dashboard Vercel e Supabase.

**Nao documentar em local publico:**
- Nao colocar secrets no README, no Obsidian compartilhado publicamente, ou em repositorio git.

---

## Task 11: Gate Final e Commit

**Descricao:** Verificar estado final e commit dos documentos de spec/plano.

**Comandos:**
```bash
git add docs/superpowers/specs/2026-05-20-free-production-deploy-design.md docs/superpowers/plans/2026-05-20-free-production-deploy.md
git status --short
git diff --check
git commit -m "docs: add free production deploy plan"
```

**Verificacao:**
- `git status` mostra apenas os dois arquivos novos.
- `git diff --check` sem erros de whitespace.
- Commits locais apenas (sem push).

---

## Decisoes do Bloco

| Decisao | Opcao Escolhida |
|---|---|
| Dominio inicial | `obraflow.vercel.app` (gratis), dominio proprio depois |
| Build time DATABASE_URL | Se `prisma generate` falhar sem ela, usar `PRISMA_GENERATE_DATABASE_URL` dummy |
| Pooler | Transaction pooler (porta 6543) para runtime Vercel |
| `NEXTAUTH_SECRET` | Gerar com `openssl rand -base64 32`, nunca versionar |
| `DEMO_LOGIN_ENABLED` | Ausente em producao (padrao false) |
| `AI_PROVIDER` | `mock` ate bloco de IA ser implementado |
| Backup pre-deploy | Export manual via `pg_dump` antes de migrations destrutivas |
| Rollback | Redeploy de versao anterior no dashboard Vercel |
