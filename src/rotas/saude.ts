import type { FastifyInstance } from 'fastify';
import { FORMATO_BACKUP, INTERVALOS_REVISAO, VERSAO_FORMATO } from '../contrato/esquemas.js';
import type { PrismaClient } from '../db.js';

const VERSAO_API = '0.1.0';

export async function rotasSaude(app: FastifyInstance, opts: { prisma: PrismaClient | null }) {
  app.get('/health', async () => {
    let banco: 'desativado' | 'ok' | 'erro' = 'desativado';
    if (opts.prisma) {
      try {
        await opts.prisma.$queryRaw`SELECT 1`;
        banco = 'ok';
      } catch (e) {
        app.log.error(e, 'Falha ao consultar o banco');
        banco = 'erro';
      }
    }
    return { status: 'ok', versao: VERSAO_API, banco };
  });

  /** O APP consulta para saber se fala o mesmo formato de dados que a API. */
  app.get('/v1/contrato', async () => ({
    formato: FORMATO_BACKUP,
    versao: VERSAO_FORMATO,
    intervalosRevisao: INTERVALOS_REVISAO,
    sincronizacao: 'planejada para a etapa 4',
  }));
}
