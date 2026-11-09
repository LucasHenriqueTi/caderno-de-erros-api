# Caderno de Erros — API

Back-end do **Caderno de Erros | ANDRÉ LUCAS**. O app ([repositório APP](../APP)) funciona primeiro no aparelho;
esta API é a **camada de sincronização** entre aparelhos (etapa 4). Até lá ela já expõe o contrato de dados e a validação de backups.

**Stack:** Node 22+, TypeScript, Fastify 5, Zod 4, Prisma 7 (PostgreSQL via `@prisma/adapter-pg`), Vitest.

## Rodar localmente

```bash
npm install            # também gera o cliente Prisma
cp .env.example .env   # no Windows: copy .env.example .env
npm run dev            # http://localhost:3333/health
```

O banco é opcional nesta etapa. Para subir um PostgreSQL local (Docker):

```bash
npm run db:up
# descomente DATABASE_URL no .env e depois:
npm run prisma:migrate
```

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor com recarga automática |
| `npm test` | Testes (Vitest, sem banco) |
| `npm run typecheck` | Verificação de tipos |
| `npm run build` / `npm start` | Compila para `dist/` e executa |
| `npm run prisma:migrate` | Cria/aplica migrações no banco de desenvolvimento |

## Rotas

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Estado da API e do banco (`desativado`, `ok` ou `erro`) |
| GET | `/v1/contrato` | Formato e versão dos dados aceitos (`caderno-de-erros`, v1) |
| POST | `/v1/backup/validar` | Valida um backup JSON exportado pelo APP e devolve um resumo |

## Estrutura

```
src/
  config/env.ts        variáveis de ambiente validadas com Zod
  contrato/esquemas.ts formato de dados compartilhado com o APP (backup v1)
  rotas/               rotas HTTP
  db.ts                cliente Prisma (criado só se houver DATABASE_URL)
  app.ts               montagem do Fastify (testável com app.inject)
  server.ts            ponto de entrada
prisma/schema.prisma   modelo para a sincronização (usuário, matérias, tópicos, erros)
```

## Próximo passo (etapa 4)

- Login por e-mail (link mágico) e tokens.
- `POST /v1/sync` (envia alterações) e `GET /v1/sync?desde=` (recebe alterações), com
  “vale a alteração mais recente” por registro (`atualizadoEm`) e exclusões como lápide (`excluidoEm`).
- Hospedagem gratuita: API no Render/Fly/Koyeb (plano free) + PostgreSQL no Neon ou Supabase (plano free).
  Se não houver opção gratuita viável, o APP segue como “Somente local” com backup JSON.

> O contrato em `src/contrato/esquemas.ts` espelha `APP/src/domain/types.ts`. Ao mudar um, atualize o outro.
