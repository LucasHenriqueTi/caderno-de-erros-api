/**
 * Contrato de dados compartilhado com o APP (formato do backup JSON, versão 1).
 * Mantenha em sincronia com APP/src/domain/types.ts e APP/src/storage/backup.ts.
 */
import { z } from 'zod';

export const FORMATO_BACKUP = 'caderno-de-erros';
export const VERSAO_FORMATO = 1;
export const INTERVALOS_REVISAO = [1, 3, 7, 15, 30] as const;

const dataAAAAMMDD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');
const iso = z.iso.datetime({ offset: true });

export const Prioridade = z.enum(['alta', 'media', 'superado']);
export const Origem = z.enum(['desconhecimento', 'confusao', 'esquecimento', 'interpretacao', 'nao_classificado']);

export const Materia = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(1).max(120),
  criadoEm: iso,
});

export const Topico = z.object({
  id: z.string().min(1),
  materiaId: z.string().min(1),
  nome: z.string().trim().min(1).max(120),
  criadoEm: iso,
});

export const HistoricoItem = z.object({
  data: iso,
  campo: z.enum(['prioridade', 'origem']),
  de: z.string().nullable(),
  para: z.string(),
});

export const Revisao = z.object({
  proxima: dataAAAAMMDD.nullable(),
  etapa: z.number().int().min(0),
  ultima: iso.nullable(),
  acertosSeguidos: z.number().int().min(0),
});

export const Erro = z.object({
  id: z.string().min(1),
  materiaId: z.string().min(1),
  topicoId: z.string().min(1),
  descricao: z.string().trim().min(1),
  correcao: z.string().trim().min(1),
  /** Registros sem origem são aceitos e tratados como "nao_classificado" — nunca se atribui origem automaticamente. */
  origem: Origem.default('nao_classificado'),
  prioridade: Prioridade,
  comoEvitar: z.string().default(''),
  banca: z.string().default(''),
  referencia: z.string().default(''),
  dataRegistro: dataAAAAMMDD,
  criadoEm: iso,
  atualizadoEm: iso,
  historico: z.array(HistoricoItem).default([]),
  revisao: Revisao,
});

export const Configuracoes = z.object({
  tema: z.enum(['claro', 'escuro']).default('claro'),
  ultimaMateriaId: z.string().nullable().default(null),
  ultimoBackupEm: iso.nullable().default(null),
});

export const ArquivoBackup = z
  .object({
    formato: z.literal(FORMATO_BACKUP),
    versao: z.number().int().min(1).max(VERSAO_FORMATO),
    exportadoEm: iso,
    materias: z.array(Materia),
    topicos: z.array(Topico),
    erros: z.array(Erro),
    configuracoes: Configuracoes.optional(),
  })
  .superRefine((b, ctx) => {
    const materias = new Set(b.materias.map((m) => m.id));
    const topicos = new Map(b.topicos.map((t) => [t.id, t.materiaId]));
    b.topicos.forEach((t, i) => {
      if (!materias.has(t.materiaId)) {
        ctx.addIssue({ code: 'custom', path: ['topicos', i, 'materiaId'], message: 'Matéria inexistente no arquivo' });
      }
    });
    b.erros.forEach((e, i) => {
      if (topicos.get(e.topicoId) !== e.materiaId) {
        ctx.addIssue({ code: 'custom', path: ['erros', i, 'topicoId'], message: 'Tópico inexistente ou de outra matéria' });
      }
    });
  });

export type ArquivoBackup = z.infer<typeof ArquivoBackup>;
