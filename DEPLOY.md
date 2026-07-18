# Deploy no Vercel — HYDRA Financial Tracker

## Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Banco de dados PostgreSQL acessível publicamente  
  (recomendado: [Neon](https://neon.tech), [Supabase](https://supabase.com) ou [Railway](https://railway.app))

---

## 1. Preparar o banco de dados

Crie um banco PostgreSQL e copie a **connection string** (ex: `postgresql://user:pass@host/db?sslmode=require`).

Execute as migrações no banco de produção:
```bash
DATABASE_URL="sua_connection_string" pnpm --filter @workspace/db run push
```

---

## 2. Importar o projeto no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Conecte o repositório Git
3. **Não altere** as configurações de build — o `vercel.json` já configura tudo:
   - Build command: `pnpm install && pnpm --filter @workspace/hydra build`
   - Output directory: `artifacts/hydra/dist/public`

---

## 3. Configurar variáveis de ambiente no Vercel

No painel do projeto → **Settings → Environment Variables**, adicione:

| Variável | Valor | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Connection string do PostgreSQL |
| `SESSION_SECRET` | string longa e aleatória | Segredo para assinar cookies de sessão |
| `NODE_ENV` | `production` | Ativa cookies seguros (HTTPS only) |

> Para gerar o SESSION_SECRET: `openssl rand -base64 32`

---

## 4. Deploy

Clique em **Deploy**. O Vercel irá:
1. Instalar dependências com pnpm
2. Compilar o frontend (Vite → `artifacts/hydra/dist/public`)
3. Criar a função serverless (`api/index.ts` → Express)
4. Criar a tabela de sessões no banco automaticamente no primeiro acesso

---

## Arquitetura no Vercel

```
https://seu-app.vercel.app/
├── /           → frontend React (estático)
├── /api/*      → Express serverless function (Node.js)
└── /api/...    → rotas da API (auth, admin, parcelas, etc.)
```

- **Sessões**: armazenadas na tabela `session` do PostgreSQL (criada automaticamente)
- **Credencial admin padrão**: CPF `000.000.000-00` / Senha `admin123`
  ⚠️ Troque a senha do admin imediatamente após o primeiro acesso em produção

---

## Troubleshooting

**Erro 500 na API**: Verifique se `DATABASE_URL` e `SESSION_SECRET` estão definidos no Vercel.

**Login não persiste**: Certifique-se que `NODE_ENV=production` está configurado para que o cookie `secure` funcione corretamente via HTTPS.

**Banco não encontrado**: Rode `pnpm --filter @workspace/db run push` com o DATABASE_URL de produção para criar as tabelas.
