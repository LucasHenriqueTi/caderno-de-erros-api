import { z } from 'zod';

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3333),
  /** Origens liberadas no CORS, separadas por vírgula (ex.: http://localhost:5173,https://meu-app.vercel.app). */
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  /** Opcional até a etapa 4: sem banco, a API sobe e informa "banco: desativado". */
  DATABASE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof esquema>;

export function lerEnv(fonte: NodeJS.ProcessEnv = process.env): Env {
  const r = esquema.safeParse(fonte);
  if (!r.success) {
    const detalhes = r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Variáveis de ambiente inválidas — ${detalhes}`);
  }
  return r.data;
}
