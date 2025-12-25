import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();
    Logger.info('Database connected successfully');
  } catch (error) {
    Logger.error('Database connection failed', error);
    process.exit(1);
  }
}

testConnection();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  Logger.info('Database disconnected');
});

export default prisma;
