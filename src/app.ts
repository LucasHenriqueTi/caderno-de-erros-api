import cors from '@fastify/cors';
import Fastify, { type FastifyServerOptions } from 'fastify';
import type { Env } from './config/env.js';
import type { PrismaClient } from './db.js';
import { rotasBackup } from './rotas/backup.js';
import { rotasSaude } from './rotas/saude.js';

export interface Dependencias {
  env: Pick<Env, 'CORS_ORIGIN'>;
  prisma: PrismaClient | null;
}

export async function criarApp(deps: Dependencias, opcoes: FastifyServerOptions = {}) {
  const app = Fastify(opcoes);

  await app.register(cors, {
    origin: deps.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
  });

  app.setErrorHandler((erro, _req, reply) => {
    const e = erro as { statusCode?: number; message?: string };
    const status = e.statusCode ?? 500;
    if (status >= 500) app.log.error(erro);
    reply.status(status).send({ erro: status >= 500 ? 'Erro interno no servidor.' : (e.message ?? 'Requisição inválida.') });
  });

  await app.register(rotasSaude, { prisma: deps.prisma });
  await app.register(rotasBackup);

  app.addHook('onClose', async () => {
    await deps.prisma?.$disconnect();
  });

  return app;
}
