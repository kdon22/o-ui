// Import Prisma Client with full type information
import { PrismaClient } from '@prisma/client'

let prismaClient: PrismaClient | null = null

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

try {
  prismaClient = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  })
} catch (error) {
  console.error('Failed to initialize Prisma Client:', error instanceof Error ? error.message : 'Unknown error')
  throw new Error('Prisma Client initialization failed - database operations cannot continue')
}

export const prisma = prismaClient

if (process.env.NODE_ENV !== 'production' && prismaClient) {
  globalForPrisma.prisma = prisma
} 