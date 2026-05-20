# Deploy Inicial Gratuito e Configuracao de Producao - Design

## Status

Draft. Aguardando aprovacao do Codex.

## Objetivo

Preparar o ObraFlow para rodar em producao usando exclusivamente planos gratuitos:

- **Vercel Hobby** para o app Next.js.
- **Supabase Free** para PostgreSQL gerenciado.
- **Subdominio proprio** para acesso do escritorio.
- **Sem storage pago, sem email transacional pago, sem VPS** neste momento.

## Problemas Atuais

1. O codigo esta pronto para producao (hash, /setup, seed guard, env validation), mas nunca foi implantado.
2. As envs de producao precisam ser configuradas manualmente na Vercel e no Supabase.
3. `NEXTAUTH_URL` precisa apontar para o dominio real de producao.
4. `NEXTAUTH_SECRET` precisa ser um valor forte gerado para producao.
5. `DEFAULT_TENANT_SLUG` so pode ser definido apos criar o primeiro tenant via /setup.
6. Dados demo do seed local nao devem poluir o banco de producao.
7. Nao ha procedimento documentado de rollback/recuperacao.
8. Subdominio proprio precisa ser configurado no DNS apontando para Vercel.

## Arquitetura de Producao Gratuita Proposta

```
[Cliente] --> DNS (subdominio) --> Vercel Edge Network
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
| Dominio | `<projeto>.vercel.app` + custom domain |
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
| Pooler | Supavisor na porta 5432 (session) ou 6543 (transaction) |

### Dominio/Subdominio Proprio

- Comprar dominio (ex: `obraflow.eng.br`, `escritorio.app`) via registro .br, Cloudflare ou similar.
- Apontar DNS para Vercel (CNAME `cname.vercel.com` ou A record para Vercel Edge IPs).
- Configurar custom domain no dashboard da Vercel (+ dominio).
- SSL automático via Vercel (certificado gerado automaticamente).

## Estrategia para Primeiro Admin

1. Deploy inicial roda com banco vazio (sem seed, sem admin).
2. Acessar `https://<dominio>/setup`.
3. /setup detecta que nao existe ADMIN, exibe formulario.
4. Preencher nome, email, senha, nome do escritorio, slug do escritorio.
5. /setup cria tenant, user com passwordHash, membership ADMIN.
6. Fazer login com as credenciais criadas.
7. Apos login, definir `DEFAULT_TENANT_SLUG` no dashboard da Vercel com o slug escolhido.
8. Redeploy (ou apenas restart) para que o JWT callback resolva o tenantId.

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

| Variavel | Obrigatoria | Valor esperado |
|---|---|---|
| `DATABASE_URL` | Sim | Supavisor transaction pooler (porta 6543) |
| `NEXTAUTH_URL` | Sim | `https://<dominio>` |
| `NEXTAUTH_SECRET` | Sim | `openssl rand -base64 32` |
| `DEFAULT_TENANT_SLUG` | Sim (apos /setup) | Slug do tenant criado |
| `DEMO_LOGIN_ENABLED` | Nao (ausente = false) | Nao configurar |
| `DEMO_LOGIN_PASSWORD` | Nao (ausente = sem fallback) | Nao configurar |
| `AI_PROVIDER` | Sim | `mock` |
| `OPENAI_API_KEY` | Nao | Nao configurar ate bloco de IA |

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
4. Se o dominio estiver quebrado, verificar DNS e SSL no dashboard da Vercel.

## Criterios de Pronto para Producao Inicial

- [ ] Vercel Hobby deployado com build passando.
- [ ] Supabase Free com migrations aplicadas (`pnpm db:deploy`).
- [ ] Dominio/subdominio resolvendo para Vercel com SSL ativo.
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
- Dominoio proprio registrado (planejar, mas nao executar registro).
- Monitoramento/alertas.
- CI/CD configurado.
- Backup automatizado.
- Rate limiting.
- Google OAuth ou outros providers.
- Gestao de usuarios/admins.
