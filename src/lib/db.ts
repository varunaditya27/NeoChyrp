/**
 * Prisma client singleton.
 * - Avoid multiple instantiations in dev (Next.js HMR) by caching on global.
 * - Add soft-fail logging + metrics hooks later.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['warn', 'error']
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
