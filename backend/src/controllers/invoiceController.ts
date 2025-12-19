import { Response } from 'express';
import InvoiceService from '../services/invoiceService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { PaymentStatus } from '@prisma/client';

export class InvoiceController {
  /**
   * POST /api/v1/services/:id/invoice
   * Generate invoice from service
   */
  static generateInvoiceFromService = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { id: serviceId } = req.params;
      const userId = req.user!.userId;

      const invoice = await InvoiceService.generateInvoiceFromService({
        serviceId,
        userId,
      });

      return ApiResponse.created(res, invoice, 'Invoice generated successfully');
    }
  );

  /**
   * POST /api/v1/invoices
   * Create standalone invoice
   */
  static createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { serviceId, totalAmount, paidAmount } = req.body;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    const invoice = await InvoiceService.createInvoice({
      serviceId,
      totalAmount,
      paidAmount,
      userId,
      companyId,
    });

    return ApiResponse.created(res, invoice, 'Invoice created successfully');
  });

  /**
   * GET /api/v1/invoices
   * Get all invoices with filters
   */
  static getAllInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    const filters: any = {
      companyId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    // Role-based filtering
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      // Branch users see only their branch invoices
      filters.branchId = req.user!.branchId;
    }

    // Optional filters
    if (req.query.branchId) {
      filters.branchId = req.query.branchId as string;
    }

    if (req.query.paymentStatus) {
      filters.paymentStatus = req.query.paymentStatus as PaymentStatus;
    }

    if (req.query.search) {
      filters.searchTerm = req.query.search as string;
    }

    // Date range filters
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    const result = await InvoiceService.getInvoices(filters);

    return ApiResponse.success(res, result, 'Invoices retrieved successfully');
  });

  /**
   * GET /api/v1/invoices/:id
   * Get invoice by ID
   */
  static getInvoiceById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const invoice = await InvoiceService.getInvoiceById(id, companyId);

    return ApiResponse.success(res, invoice, 'Invoice retrieved successfully');
  });

  /**
   * GET /api/v1/services/:id/invoice
   * Get invoice by service ID
   */
  static getInvoiceByServiceId = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id: serviceId } = req.params;
    const companyId = req.user!.companyId;

    const invoice = await InvoiceService.getInvoiceByServiceId(serviceId, companyId);

    if (!invoice) {
      return ApiResponse.success(res, null, 'No invoice found for this service');
    }

    return ApiResponse.success(res, invoice, 'Invoice retrieved successfully');
  });

  /**
   * PUT /api/v1/invoices/:id
   * Update invoice
   */
  static updateInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { totalAmount, paidAmount } = req.body;
    const companyId = req.user!.companyId;

    const invoice = await InvoiceService.updateInvoice(
      id,
      { totalAmount, paidAmount },
      companyId
    );

    return ApiResponse.success(res, invoice, 'Invoice updated successfully');
  });

  /**
   * DELETE /api/v1/invoices/:id
   * Delete invoice
   */
  static deleteInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    await InvoiceService.deleteInvoice(id, companyId);

    return ApiResponse.success(res, null, 'Invoice deleted successfully');
  });

  /**
   * PUT /api/v1/invoices/:id/sync
   * Sync invoice from service - recalculates totals from current service data
   */
  static syncFromService = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const invoice = await InvoiceService.syncFromService(id, companyId);

    return ApiResponse.success(res, invoice, 'Invoice synced from service successfully');
  });

  /**
   * POST /api/v1/invoices/:id/payments
   * Record payment for invoice
   */
  static recordPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id: invoiceId } = req.params;
    const { amount, paymentMethodId, transactionId, notes } = req.body;
    const userId = req.user!.userId;

    const result = await InvoiceService.recordPayment({
      invoiceId,
      amount,
      paymentMethodId,
      transactionId,
      notes,
      userId,
    });

    return ApiResponse.success(res, result, 'Payment recorded successfully');
  });

  /**
   * GET /api/v1/invoices/:id/pdf?format=A4|A5|thermal-2|thermal-3
   * Download invoice PDF
   */
  static downloadInvoicePDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const format = (req.query.format as string) || 'A4';

    // Validate format
    const validFormats = ['A4', 'A5', 'thermal-2', 'thermal-3'];
    if (!validFormats.includes(format)) {
      return ApiResponse.badRequest(res, 'Invalid format. Valid formats are: A4, A5, thermal-2, thermal-3');
    }

    // Generate PDF with specified format
    const result = await InvoiceService.regenerateInvoicePDF(id, companyId, format);

    return ApiResponse.success(
      res,
      { pdfUrl: result.pdfUrl },
      'PDF generated successfully'
    );
  });

  /**
   * POST /api/v1/invoices/:id/regenerate-pdf
   * Regenerate invoice PDF
   */
  static regenerateInvoicePDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const invoice = await InvoiceService.regenerateInvoicePDF(id, companyId);

    return ApiResponse.success(res, invoice, 'Invoice PDF regenerated successfully');
  });
}

export default InvoiceController;
