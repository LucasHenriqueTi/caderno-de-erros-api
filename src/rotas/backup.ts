import type { FastifyInstance } from 'fastify';
import { ArquivoBackup } from '../contrato/esquemas.js';

/** Valida um backup do APP contra o contrato — útil para testes e, na etapa 4, para a primeira sincronização. */
export async function rotasBackup(app: FastifyInstance) {
  app.post('/v1/backup/validar', { bodyLimit: 20 * 1024 * 1024 }, async (req, reply) => {
    const r = ArquivoBackup.safeParse(req.body);
    if (!r.success) {
      return reply.status(422).send({
        valido: false,
        problemas: r.error.issues.slice(0, 20).map((i) => ({ caminho: i.path.join('.'), mensagem: i.message })),
      });
    }
    const b = r.data;
    return {
      valido: true,
      resumo: {
        erros: b.erros.length,
        materias: b.materias.length,
        topicos: b.topicos.length,
        semOrigem: b.erros.filter((e) => e.origem === 'nao_classificado').length,
        exportadoEm: b.exportadoEm,
      },
    };
  });
}
