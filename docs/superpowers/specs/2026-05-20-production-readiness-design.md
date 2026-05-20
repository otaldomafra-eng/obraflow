# Preparacao para Producao Inicial Gratuita - Design

## Status

Aprovado com ajustes Codex em 2026-05-20.

## Objetivo

Preparar o ObraFlow para uso real inicial em infraestrutura gratuita:

- Vercel Hobby para o app.
- Supabase Free para o banco.
- Subdominio proprio depois da validacao inicial.
- Sem depender de login demo para uso real.

## Problemas Atuais

1. O login atual usa `DEMO_LOGIN_PASSWORD` em plaintext.
2. Em producao, se `DEMO_LOGIN_ENABLED` nao for `"true"`, nenhum login por Credentials funciona.
3. Nao existe fluxo de primeiro admin/tenant.
4. `NEXTAUTH_URL` e `NEXTAUTH_SECRET` nao sao validados explicitamente.
5. `prisma/seed.ts` pode popular dados demo se executado contra producao por engano.
6. O sistema ainda precisa de um checklist claro para Vercel Hobby + Supabase Free.

## Decisoes Codex

| Tema | Decisao |
|---|---|
| Hash de senha | Usar `bcryptjs`, por ser JS puro e simples no Vercel |
| Provider | Manter Credentials Provider neste bloco |
| Schema | Criar migration apenas para `User.passwordHash` |
| Setup inicial | Criar rota publica `/setup`, ativa somente quando nao existe ADMIN |
| Admins futuros | Fora deste bloco; `/setup` cria apenas o primeiro ADMIN |
| `AUTH_SECRET` | Nao usar como obrigatoria; padronizar `NEXTAUTH_SECRET` |
| `DEFAULT_TENANT_SLUG` | Recomendado apos setup, mas nao deve bloquear `/setup` |
| Demo login | Manter fallback para desenvolvimento/demo, mas nao depender dele em producao real |
| E2E setup | Nao testar `/setup` em banco compartilhado seeded; usar testes unitarios/integrados |
| S3/AI envs | Manter comentadas como uso futuro |
| Senha inicial | Minimo 8 caracteres |

## Escopo de Implementacao

### Autenticacao

- Adicionar `passwordHash String?` ao model `User`.
- Criar helpers `hashPassword` e `verifyPassword`.
- Atualizar `authorize()`:
  - se o usuario tem `passwordHash`, validar com hash em qualquer ambiente;
  - se nao tem hash, permitir demo apenas em desenvolvimento ou quando `DEMO_LOGIN_ENABLED=true`;
  - em producao real, usuario sem hash nao deve logar.

### Setup Inicial

Criar `/setup`:

- publica no middleware;
- se nao existe `Membership` com role `ADMIN`, renderiza formulario;
- cria tenant, user com hash e membership ADMIN;
- se ja existe ADMIN, redireciona para `/sign-in`;
- nao depende de `DEFAULT_TENANT_SLUG`.

### Seed

Proteger `prisma/seed.ts`:

- em `NODE_ENV=production`, bloquear execucao por padrao;
- permitir override apenas com flag explicita, se realmente necessario.

### Env

Validar/documentar:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DEFAULT_TENANT_SLUG` recomendado apos setup
- `DEMO_LOGIN_ENABLED` e `DEMO_LOGIN_PASSWORD` apenas dev/demo

### Documentacao Operacional

Atualizar `.env.example` e deixar instrucoes claras para:

- Vercel Hobby;
- Supabase Free;
- subdominio futuro;
- backup/exportacao manual inicial;
- dados demo.

## Fora de Escopo

- Google OAuth.
- Recuperacao de senha.
- Convite de usuarios.
- Gestao completa de usuarios/admins.
- Rate limiting.
- Upload/storage real.
- Migrations alem de `User.passwordHash`.
- Deploy real.

## Criterios de Aceite

- Um usuario real com `passwordHash` consegue logar sem `DEMO_LOGIN_PASSWORD`.
- Login demo continua funcionando em desenvolvimento.
- `/setup` so funciona antes do primeiro ADMIN.
- Seed nao roda em producao sem confirmacao explicita.
- `.env.example` documenta producao inicial.
- Testes cobrem hash, authorize, setup e seed guard.
- Gates finais passam.
