import { PrismaClient } from '@prisma/client';
import { config } from './env';
import { Logger } from '../utils/logger';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: config.database.url,
      },
    },
    log: config.env === 'development' 
      ? config.logging?.sqlQueries 
        ? ['query', 'error', 'warn'] 
        : ['error', 'warn']
      : ['error'],
    errorFormat: config.env === 'development' ? 'pretty' : 'minimal',
  });
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (config.env !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Database health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    Logger.info('✅ Database connection successful - Cloud DB connected');
    Logger.info(`Database URL: ${config.database.url.split('@')[1]?.split('/')[0] || 'configured'}`);
    return true;
  } catch (error) {
    Logger.error('❌ Database connection failed:', error);
    return false;
  }
}

// Initialize connection
async function initializeConnection() {
  try {
    await prisma.$connect();
    Logger.info('Database connected successfully');
    
    // Log connection info
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    Logger.info(`PostgreSQL Version: ${result[0]?.version?.split(' ')[1] || 'Unknown'}`);
  } catch (error) {
    Logger.error('Database connection failed', error);
    if (config.env === 'production') {
      process.exit(1);
    }
  }
}

// Initialize on startup
initializeConnection();

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  Logger.info('Database connection closed');
}

process.on('beforeExit', async () => {
  await disconnectDatabase();
});

export default prisma;
export { prisma };
