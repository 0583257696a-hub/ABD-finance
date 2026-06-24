import type { PrismaClient as PrismaClientType } from '@prisma/client'
import type { Pool as PoolType } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientType
  prismaPool?: PoolType
}

export async function getPrisma(): Promise<PrismaClientType> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const [{ PrismaClient }, { PrismaPg }, { Pool }] = await Promise.all([
    import('@prisma/client'),
    import('@prisma/adapter-pg'),
    import('pg'),
  ])

  const connectionString =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    'postgresql://user:password@localhost:5432/abd_finance'

  const pool =
    globalForPrisma.prismaPool ??
    new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })

  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter }) as PrismaClientType

  globalForPrisma.prismaPool = pool
  globalForPrisma.prisma = prisma

  return prisma
}
