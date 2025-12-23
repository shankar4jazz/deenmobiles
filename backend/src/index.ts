import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env';
import { Logger } from './utils/logger';
import { ApiResponse } from './utils/response';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import branchRoutes from './routes/branchRoutes';
import permissionRoutes from './routes/permissionRoutes';
import roleRoutes from './routes/roleRoutes';
import employeeRoutes from './routes/employeeRoutes';
import customerRoutes from './routes/customerRoutes';
import supplierRoutes from './routes/supplierRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import supplierPaymentRoutes from './routes/supplierPaymentRoutes';
import masterDataRoutes from './routes/masterDataRoutes';
import itemRoutes from './routes/itemRoutes';
import branchInventoryRoutes from './routes/branchInventoryRoutes';
import pettyCashTransferRoutes from './routes/pettyCashTransferRoutes';
import pettyCashRequestRoutes from './routes/pettyCashRequestRoutes';
import expenseRoutes from './routes/expenseRoutes';
import purchaseReturnRoutes from './routes/purchaseReturnRoutes';
import salesReturnRoutes from './routes/salesReturnRoutes';
import serviceRoutes from './routes/serviceRoutes';
import jobSheetRoutes from './routes/jobSheetRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import invoiceTemplateRoutes from './routes/invoiceTemplateRoutes';
import themeRoutes from './routes/themeRoutes';
import estimateRoutes from './routes/estimateRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import customerDeviceRoutes from './routes/customerDeviceRoutes';
import jobSheetTemplateRoutes from './routes/jobSheetTemplateRoutes';
import jobSheetTemplateCategoryRoutes from './routes/jobSheetTemplateCategoryRoutes';
import technicianRoutes from './routes/technicianRoutes';
import publicRoutes from './routes/publicRoutes';
import documentNumberRoutes from './routes/documentNumberRoutes';
import reportRoutes from './routes/reportRoutes';
import taskRoutes from './routes/taskRoutes';
import cashSettlementRoutes from './routes/cashSettlementRoutes';
import gstr1Routes from './routes/gstr1Routes';
import warrantyRoutes from './routes/warrantyRoutes';

const app: Application = express();

// Health check (before other middleware to avoid CORS/helmet issues)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { status: 'OK', timestamp: new Date().toISOString() }, message: 'Server is healthy' });
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
const corsOrigins = config.cors.origin.split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin: corsOrigins.length === 0
    ? true  // Allow all origins if none specified
    : corsOrigins.length === 1
      ? corsOrigins[0]
      : corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// API version route
app.get(`/api/${config.apiVersion}`, (req: Request, res: Response) => {
  ApiResponse.success(res, {
    name: 'DeenMobiles API',
    version: config.apiVersion,
    environment: config.env,
  });
});

// API Routes
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/dashboard`, dashboardRoutes);
app.use(`/api/${config.apiVersion}/branches`, branchRoutes);
app.use(`/api/${config.apiVersion}/permissions`, permissionRoutes);
app.use(`/api/${config.apiVersion}/roles`, roleRoutes);
app.use(`/api/${config.apiVersion}/employees`, employeeRoutes);
app.use(`/api/${config.apiVersion}/customers`, customerRoutes);
app.use(`/api/${config.apiVersion}/suppliers`, supplierRoutes);
app.use(`/api/${config.apiVersion}/inventory`, inventoryRoutes);
app.use(`/api/${config.apiVersion}/purchase-orders`, purchaseOrderRoutes);
app.use(`/api/${config.apiVersion}/supplier-payments`, supplierPaymentRoutes);
app.use(`/api/${config.apiVersion}/master-data`, masterDataRoutes);
app.use(`/api/${config.apiVersion}/items`, itemRoutes);
app.use(`/api/${config.apiVersion}/branch-inventory`, branchInventoryRoutes);
app.use(`/api/${config.apiVersion}/petty-cash-transfers`, pettyCashTransferRoutes);
app.use(`/api/${config.apiVersion}/petty-cash-requests`, pettyCashRequestRoutes);
app.use(`/api/${config.apiVersion}/expenses`, expenseRoutes);
app.use(`/api/${config.apiVersion}/purchase-returns`, purchaseReturnRoutes);
app.use(`/api/${config.apiVersion}/sales-returns`, salesReturnRoutes);
app.use(`/api/${config.apiVersion}/services`, serviceRoutes);
app.use(`/api/${config.apiVersion}/jobsheets`, jobSheetRoutes);
app.use(`/api/${config.apiVersion}/invoices`, invoiceRoutes);
app.use(`/api/${config.apiVersion}/invoice-templates`, invoiceTemplateRoutes);
app.use(`/api/${config.apiVersion}/themes`, themeRoutes);
app.use(`/api/${config.apiVersion}/estimates`, estimateRoutes);
app.use(`/api/${config.apiVersion}/analytics`, analyticsRoutes);
app.use(`/api/${config.apiVersion}/customer-devices`, customerDeviceRoutes);
app.use(`/api/${config.apiVersion}/job-sheet-templates`, jobSheetTemplateRoutes);
app.use(`/api/${config.apiVersion}/job-sheet-template-categories`, jobSheetTemplateCategoryRoutes);
app.use(`/api/${config.apiVersion}/technicians`, technicianRoutes);
app.use(`/api/${config.apiVersion}/document-numbers`, documentNumberRoutes);
app.use(`/api/${config.apiVersion}/reports`, reportRoutes);
app.use(`/api/${config.apiVersion}/reports/gstr1`, gstr1Routes);
app.use(`/api/${config.apiVersion}/tasks`, taskRoutes);
app.use(`/api/${config.apiVersion}/cash-settlements`, cashSettlementRoutes);
app.use(`/api/${config.apiVersion}/warranties`, warrantyRoutes);

// Public routes (no authentication required)
app.use(`/api/${config.apiVersion}/public`, publicRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  Logger.info(`Server running in ${config.env} mode on port ${PORT}`);
  Logger.info(`API version: ${config.apiVersion}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  Logger.error(`Unhandled Rejection - Reason: ${reason}`);
  // Don't exit the process in development mode - let nodemon handle it
  if (config.env === 'production') {
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  Logger.error(`Uncaught Exception: ${error.message}`);
  // Don't exit the process in development mode - let nodemon handle it
  if (config.env === 'production') {
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received. Closing server gracefully...');
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

export default app;









