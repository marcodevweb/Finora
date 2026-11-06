import { PrismaClient } from '@prisma/client';
import { PrismaClient as SqlitePrismaClient } from '@prisma/client-sqlite';

const prismaGlobal = globalThis as unknown as { finoraPrisma?: PrismaClient };
const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || '';
const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');

if (process.env.NODE_ENV === 'production' && !isPostgres) {
  throw new Error('Production requires a persistent PostgreSQL connection.');
}

const createClient = () => {
  const log: ('error' | 'warn')[] = process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'];
  return isPostgres ? new PrismaClient({ log }) : new SqlitePrismaClient({ log });
};
const prisma = (prismaGlobal.finoraPrisma ?? createClient()) as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.finoraPrisma = prisma;
}

export default prisma;
