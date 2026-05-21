# Deploy Inicial Gratuito e Configuracao de Producao - Design

## Status

Aprovado com ajustes Codex em 2026-05-20.

## Objetivo

Preparar o ObraFlow para rodar em producao usando exclusivamente planos gratuitos:

- **Vercel Hobby** para o app Next.js.
- **Supabase Free** para PostgreSQL gerenciado.
- **Dominio Vercel gratuito** (`<projeto>.vercel.app`) neste momento; subdominio proprio fica para etapa posterior.
- **Sem storage pago, sem email transacional pago, sem VPS** neste momento.

## Problemas Atuais

1. O codigo esta pronto para producao (hash, /setup, seed guard, env validation), mas nunca foi implantado.
2. As envs de producao precisam ser configuradas manualmente na Vercel e no Supabase.
3. `prisma.config.ts` usa `requireEnv("DATABASE_URL")`, portanto o build na Vercel exige `DATABASE_URL` configurada antes do primeiro deploy.
4. `NEXTAUTH_URL` precisa apontar para o dominio de producao (`<projeto>.vercel.app`).
5. `NEXTAUTH_SECRET` precisa ser um valor forte gerado para producao.
6. `DEFAULT_TENANT_SLUG` so pode ser definido apos criar o primeiro tenant via /setup.
7. Dados demo do seed local nao devem poluir o banco de producao.
8. Nao ha procedimento documentado de rollback/recuperacao.

## Arquitetura de Producao Gratuita Proposta

```
[Cliente] --> Vercel Edge Network
                  |
           Vercel Hobby (Next.js)
                  |
        Prisma + Supavisor Pooler
                  |
          Supabase Free (PostgreSQL)
```

### Vercel Hobby como Runtime

| Aspecto | Detalhe |
|---|---|
| Plano | Hobby (gratuito) |
| Limite de bandwidth | 100 GB/mes |
| Limite de execucao | 10s CPU, 30s total (Serverless) |
| Limite de builds | 6.000 min/mes (Hobby) |
| Concorrencia | 1 concurrent build |
| Cold start | Tipico 500ms-2s em Hobby |
| Dominio | `<projeto>.vercel.app` |
| Git integration | Autodetect via `vercel.json` ou dashboard |

### Supabase Free como Banco

| Aspecto | Detalhe |
|---|---|
| Plano | Free |
| Database size | 500 MB |
| Max connections via pooler | 15 |
| Row level security | Obrigatorio para Data API |
| Automatic pause | Apos 1 semana de inatividade (dados mantidos) |
| Backups | Nao ha PITR nativo no Free; export manual via dashboard |
| Pooler runtime (Vercel) | Supavisor transaction pooler na porta 6543 |
| Pooler migrations (local) | Supavisor session pooler na porta 5432 |

### Dominio

Decisao: comecar com o dominio gratuito da Vercel (`<projeto>.vercel.app`). Subdominio proprio fica para etapa posterior, quando houver necessidade e orcamento.

## Estrategia para Primeiro Admin

1. Deploy inicial roda com banco vazio (sem seed, sem admin).
2. Antes do deploy, `DATABASE_URL` ja deve estar configurada na Vercel (exigida pelo build).
3. Acessar `https://<projeto>.vercel.app/setup`.
4. /setup detecta que nao existe ADMIN, exibe formulario.
5. Preencher nome, email, senha, nome do escritorio, slug do escritorio.
6. /setup cria tenant, user com passwordHash, membership ADMIN.
7. Fazer login com as credenciais criadas.
8. Apos login, definir `DEFAULT_TENANT_SLUG` no dashboard da Vercel com o slug escolhido.
9. Redeploy para que o JWT callback resolva o tenantId.

## Estrategia para Nao Vazar Dados Demo

O seed local cria dados com prefixo "demo-" em externalKeys e o usuario `admin@obraflow.local`. Em producao:

- Nao rodar `pnpm db:seed` em producao (ja protegido pelo seed guard).
- Nao rodar `pnpm demo:seed` em producao.
- Se dados demo existirem no banco de producao (ex: staging acidental), usar `pnpm demo:clean` com `CONFIRM_CLEAN_DEMO=1`.
- O script clean-demo usa prefixo "Demo Beta"; o seed principal usa "demo-" em externalKeys. Verificar se ambos sao cobertos.

## Checklist de Seguranca

- [ ] Repositorio publico nao contem secrets, apenas `.env.example`.
- [ ] `.env` e `.vercel` no `.gitignore`.
- [ ] Envs de producao configuradas apenas no dashboard da Vercel/ Supabase.
- [ ] RLS e Data API do Supabase bloqueadas (ja feito no bloco anterior).
- [ ] `NEXTAUTH_SECRET` forte gerado com `openssl rand -base64 32`.
- [ ] `DEMO_LOGIN_ENABLED` NAO configurado em producao (padrao false).
- [ ] `DEMO_LOGIN_PASSWORD` ausente ou vazio em producao.
- [ ] `AI_PROVIDER=mock` inicialmente (sem chave OpenAI exposta).
- [ ] `service_role` key do Supabase nunca usada no frontend.
- [ ] Proxy middleware protege todas as rotas exceto /setup e /sign-in.

## Variaveis Obrigatorias de Producao

| Variavel | Obrigatoria | Como obter / valor |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string do Supabase Free. Para runtime Vercel: transaction pooler (`<host>:6543`). Para migrations via terminal local: session pooler (`<host>:5432`). |
| `NEXTAUTH_URL` | Sim | `https://<projeto>.vercel.app` |
| `NEXTAUTH_SECRET` | Sim | `openssl rand -base64 32` no terminal local |
| `DEFAULT_TENANT_SLUG` | Sim (apos /setup) | Slug do tenant criado via /setup |
| `DEMO_LOGIN_ENABLED` | Nao (ausente = false) | Nao configurar |
| `DEMO_LOGIN_PASSWORD` | Nao (ausente = sem fallback) | Nao configurar |
| `AI_PROVIDER` | Sim | `mock` |

## Preview Deployments

Decisao inicial: nao usar Preview Deployments com o banco de producao para testes com escrita. Para v1 gratuita, o foco e em Production apenas. Se previews forem necessarios depois, criar um Supabase separado ou banco isolado.

## Limitacoes do Plano Gratis

### Vercel Hobby

| Limitacao | Impacto |
|---|---|
| Cold start em Serverless Functions | Primeira request apos inatividade pode levar ~1s |
| Tempo de execucao maximo 30s | Operacoes lentas (batch, relatorios) podem falhar |
| Sem CDN/Edge para renderizacao | Todo o SSR vem de regiao unica (default us-east) |
| Sem analytics embutido | Precisa de ferramenta externa se necessario |
| 1 membro de equipe | Nao da para adicionar outros devs ao projeto Vercel |

### Supabase Free

| Limitacao | Impacto |
|---|---|
| 500 MB de banco | Suficiente para meses/anos de uso de escritorio pequeno |
| Pausa apos 1 semana de inatividade | Se ninguem acessar o app por 7 dias, banco pausa (dados mantidos) |
| Sem PITR/backup automatico | Necessario export manual antes de migrations destrutivas |
| 15 conexoes simultaneas via pooler | Suficiente para time pequeno |
| Sem suporte tecnico | Apenas comunidade Discord |

## Rollback e Recuperacao Inicial

### Rollback de Deploy na Vercel

1. No dashboard da Vercel, ir em "Deployments".
2. Identificar o deployment estavel anterior.
3. Clicar nos tres pontos > "Promote to Production".
4. O deployment anterior volta a ser o ativo.

### Backup Manual do Supabase Antes de Mudancas Grandes

1. No dashboard do Supabase, ir em "Database" > "Database backups" / "SQL Editor".
2. Usar `pg_dump` via conexao direta (nao pooler):
   ```bash
   pg_dump --no-owner --no-acl \
     "postgresql://postgres.<ref>:[password]@<host>:5432/postgres" \
     > backup-$(date +%Y%m%d).sql
   ```
3. Restaurar via `psql` se necessario:
   ```bash
   psql "postgresql://..." < backup.sql
   ```

### Procedimento de Emergencia

Se o deploy quebrar o login ou o setup:

1. Verificar se `/setup` ainda responde (rota publica).
2. Se `/setup` redirecionar para `/sign-in` mas login nao funciona, verificar logs da Vercel.
3. Se o banco estiver corrompido, restaurar do ultimo backup.

## Criterios de Pronto para Producao Inicial

- [ ] Vercel Hobby deployado com build passando.
- [ ] Supabase Free com migrations aplicadas (`pnpm db:deploy` com session pooler).
- [ ] `/setup` acessivel e funcional.
- [ ] Login com admin criado via /setup funciona.
- [ ] Login demo NAO funciona em producao.
- [ ] `DEMO_LOGIN_ENABLED` ausente ou false.
- [ ] Nenhuma env de producao no codigo fonte.
- [ ] `.env` no `.gitignore`.
- [ ] Smoke test basico: criar cliente, imovel, servico.
- [ ] Documentacao operacional registrada.

## Fora de Escopo

- Email transacional (recuperacao de senha, convites).
- Storage S3 real (uploads de documentos).
- Subdominio proprio (planejado para etapa posterior).
- Monitoramento/alertas.
- CI/CD configurado.
- Backup automatizado.
- Preview Deployments.
- Rate limiting.
- Google OAuth ou outros providers.
- Gestao de usuarios/admins.
