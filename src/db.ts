import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

/** Cria o cliente Prisma somente quando há DATABASE_URL (o banco é opcional até a etapa 4). */
export function criarPrisma(databaseUrl: string | undefined): PrismaClient | null {
  if (!databaseUrl) return null;
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

export type { PrismaClient };
