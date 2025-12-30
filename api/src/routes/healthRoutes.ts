import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/database';
import { ApiResponse } from '../utils/response';
import os from 'os';
import { config } from '../config/env';

const router = Router();

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  ApiResponse.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DeenMobiles API',
    version: config.apiVersion,
  });
});

// Detailed health check with all service statuses
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const checks = {
    api: {
      status: 'healthy',
      uptime: process.uptime(),
      version: config.apiVersion,
      environment: config.env,
      port: config.port,
    },
    database: {
      status: 'checking',
      connected: false,
      url: config.database.url ? 'configured' : 'not configured',
    },
    memory: {
      used: process.memoryUsage(),
      system: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%',
      },
    },
    system: {
      platform: os.platform(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
      hostname: os.hostname(),
    },
    timestamp: new Date().toISOString(),
    responseTime: 0,
  };

  // Check database connection
  try {
    const dbConnected = await checkDatabaseConnection();
    checks.database.status = dbConnected ? 'healthy' : 'unhealthy';
    checks.database.connected = dbConnected;
  } catch (error) {
    checks.database.status = 'error';
    checks.database.connected = false;
  }

  // Calculate response time
  checks.responseTime = Date.now() - startTime;

  // Determine overall health
  const isHealthy = checks.database.connected && checks.api.status === 'healthy';

  if (isHealthy) {
    ApiResponse.success(res, checks, 'All systems operational');
  } else {
    res.status(503).json({
      success: false,
      data: checks,
      message: 'Some systems are degraded',
    });
  }
});

// Database-specific health check
router.get('/database', async (req: Request, res: Response) => {
  try {
    const isConnected = await checkDatabaseConnection();
    
    if (isConnected) {
      ApiResponse.success(res, {
        connected: true,
        message: 'Database connection successful',
      });
    } else {
      res.status(503).json({
        success: false,
        data: {
          connected: false,
          message: 'Database connection failed',
        },
      });
    }
  } catch (error: any) {
    res.status(503).json({
      success: false,
      data: {
        connected: false,
        message: 'Database health check failed',
        error: error.message,
      },
    });
  }
});

// Readiness probe for Kubernetes/Docker
router.get('/ready', async (req: Request, res: Response) => {
  const dbConnected = await checkDatabaseConnection();
  
  if (dbConnected) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false });
  }
});

// Liveness probe for Kubernetes/Docker
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

export default router;