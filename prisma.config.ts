import { defineConfig } from 'prisma/config';

// Prisma 7 não carrega o .env sozinho; o Node 22+ tem leitor nativo.
try {
  process.loadEnvFile();
} catch {
  /* sem .env: usa as variáveis do ambiente */
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // Placeholder permite rodar `prisma generate` sem banco configurado.
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/placeholder',
  },
});
