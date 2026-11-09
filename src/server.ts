import { criarApp } from './app.js';
import { lerEnv } from './config/env.js';
import { criarPrisma } from './db.js';

try {
  process.loadEnvFile();
} catch {
  /* sem .env: usa as variáveis do ambiente */
}

const env = lerEnv();
const app = await criarApp(
  { env, prisma: criarPrisma(env.DATABASE_URL) },
  { logger: { level: env.NODE_ENV === 'test' ? 'silent' : 'info' } },
);

for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sinal, () => {
    void app.close().finally(() => process.exit(0));
  });
}

await app.listen({ host: env.HOST, port: env.PORT });
