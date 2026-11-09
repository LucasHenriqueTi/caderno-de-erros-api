import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from './app.js';
import { lerEnv } from './config/env.js';

type App = Awaited<ReturnType<typeof criarApp>>;
let app: App;

const AGORA = '2026-11-06T12:00:00.000Z';

function backupValido() {
  return {
    formato: 'caderno-de-erros',
    versao: 1,
    exportadoEm: AGORA,
    materias: [{ id: 'm1', nome: 'Direito Administrativo', criadoEm: AGORA }],
    topicos: [{ id: 't1', materiaId: 'm1', nome: 'Atos administrativos', criadoEm: AGORA }],
    erros: [
      {
        id: 'e1',
        materiaId: 'm1',
        topicoId: 't1',
        descricao: 'Confundi anulação com revogação',
        correcao: 'Anulação: ilegalidade. Revogação: conveniência.',
        origem: 'confusao',
        prioridade: 'alta',
        comoEvitar: '',
        banca: 'CEBRASPE',
        referencia: '',
        dataRegistro: '2026-11-06',
        criadoEm: AGORA,
        atualizadoEm: AGORA,
        historico: [{ data: AGORA, campo: 'prioridade', de: null, para: 'alta' }],
        revisao: { proxima: '2026-11-07', etapa: 0, ultima: null, acertosSeguidos: 0 },
      },
    ],
    configuracoes: { tema: 'claro', ultimaMateriaId: 'm1', ultimoBackupEm: null },
  };
}

beforeAll(async () => {
  app = await criarApp({ env: { CORS_ORIGIN: 'http://localhost:5173' }, prisma: null });
});
afterAll(() => app.close());

describe('saúde', () => {
  it('GET /health responde sem banco configurado', async () => {
    const r = await app.inject({ method: 'GET', url: '/health' });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ status: 'ok', banco: 'desativado' });
  });

  it('GET /v1/contrato informa formato e versão', async () => {
    const r = await app.inject({ method: 'GET', url: '/v1/contrato' });
    expect(r.json()).toMatchObject({ formato: 'caderno-de-erros', versao: 1, intervalosRevisao: [1, 3, 7, 15, 30] });
  });

  it('libera CORS para a origem do APP', async () => {
    const r = await app.inject({ method: 'GET', url: '/health', headers: { origin: 'http://localhost:5173' } });
    expect(r.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});

describe('POST /v1/backup/validar', () => {
  it('aceita um backup válido do APP', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/backup/validar', payload: backupValido() });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ valido: true, resumo: { erros: 1, materias: 1, topicos: 1, semOrigem: 0 } });
  });

  it('erro sem origem vira "nao_classificado"', async () => {
    const b = backupValido();
    delete (b.erros[0] as Partial<(typeof b.erros)[0]>).origem;
    const r = await app.inject({ method: 'POST', url: '/v1/backup/validar', payload: b });
    expect(r.json()).toMatchObject({ valido: true, resumo: { semOrigem: 1 } });
  });

  it('rejeita prioridade inválida e referências quebradas', async () => {
    const b = backupValido();
    b.erros[0].prioridade = 'urgente';
    b.erros[0].topicoId = 'inexistente';
    const r = await app.inject({ method: 'POST', url: '/v1/backup/validar', payload: b });
    expect(r.statusCode).toBe(422);
    const caminhos = r.json().problemas.map((p: { caminho: string }) => p.caminho);
    expect(caminhos).toContain('erros.0.prioridade');
  });

  it('rejeita arquivo de outro formato', async () => {
    const r = await app.inject({ method: 'POST', url: '/v1/backup/validar', payload: { ...backupValido(), formato: 'outro' } });
    expect(r.statusCode).toBe(422);
  });
});

describe('ambiente', () => {
  it('usa valores padrão e valida DATABASE_URL', () => {
    expect(lerEnv({})).toMatchObject({ PORT: 3333, CORS_ORIGIN: 'http://localhost:5173' });
    expect(() => lerEnv({ DATABASE_URL: 'não é url' })).toThrow(/DATABASE_URL/);
  });
});
