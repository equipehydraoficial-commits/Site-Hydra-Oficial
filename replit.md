# HYDRA Financial Tracker

Sistema de controle de contribuições financeiras para equipes/turmas. Membros pagam parcelas mensais e acumulam pontos por pontualidade.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — rodar o servidor API (porta 8080)
- `pnpm --filter @workspace/hydra run dev` — rodar o frontend (porta 24711)
- `pnpm run typecheck` — typecheck completo em todos os pacotes
- `pnpm run build` — typecheck + build de todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks React Query e schemas Zod do OpenAPI
- `pnpm --filter @workspace/db run push` — aplicar mudanças de schema no DB (somente dev)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — segredo para sessões

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter (roteamento)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: express-session + bcryptjs
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — contrato da API (fonte da verdade)
- `lib/db/src/schema/` — schema do banco (users, installments, pix_config)
- `artifacts/api-server/src/routes/` — rotas Express
- `artifacts/hydra/src/` — frontend React

## Credenciais padrão (admin)

- CPF: `000.000.000-00`
- Senha: `admin123`

## Sistema de pontos

- Pago no prazo (≤0 dias): +70 pts (+50 + 20 bônus)
- Pago com até 1 semana de atraso: +50 pts
- Marcado como atrasado (> 1 semana): -30 pts
- Pago após desconto de atraso: +50 pts

## Plano padrão

- 8 parcelas de R$7,50 = R$60,00 total
- Criadas automaticamente no cadastro

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- O build do API server precisa rodar antes de iniciar (`pnpm run build && node dist/index.mjs`)
- Imagens de comprovante são enviadas como base64
- Session cookies requerem `credentials: true` no fetch do frontend

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
