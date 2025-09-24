// Conditional Prisma Client import to handle Turbopack issues
let PrismaClient: any
let prismaClient: any = null

try {
  // Dynamic import to handle Turbopack compatibility issues
  const prismaModule = require('@prisma/client')
  PrismaClient = prismaModule.PrismaClient
} catch (error) {
  console.warn('Prisma Client not available:', error instanceof Error ? error.message : 'Unknown error')
  console.warn('Database operations will be disabled. This is normal during development setup.')
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

// Create a mock client for development when Prisma isn't available
const createMockPrisma = () => ({
  $connect: () => Promise.resolve(),
  $disconnect: () => Promise.resolve(),
  $transaction: () => Promise.resolve(),
})

if (PrismaClient) {
  try {
    prismaClient = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    })
  } catch (error) {
    console.warn('Failed to initialize Prisma Client:', error instanceof Error ? error.message : 'Unknown error')
    console.warn('Using mock Prisma client for development')
    prismaClient = createMockPrisma()
  }
} else {
  console.warn('Using mock Prisma client - database operations disabled')
  prismaClient = createMockPrisma()
}

export const prisma = prismaClient

if (process.env.NODE_ENV !== 'production' && prismaClient && prismaClient !== createMockPrisma()) {
  globalForPrisma.prisma = prisma
} 