import { Request, Response, NextFunction } from 'express';
import { SalesReturnService } from '../services/salesReturnService';
import { ApiResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { SalesReturnReason } from '@prisma/client';

export class SalesReturnController {
  /**
   * Get all sales returns for a company
   * GET /api/v1/sales-returns
   */
  static async getAllReturns(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = req.query.branchId as string | undefined;

      const returns = await SalesReturnService.getAllReturns(companyId, branchId);

      ApiResponse.success(res, returns, 'Sales returns retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get eligible invoices for return
   * GET /api/v1/sales-returns/eligible-invoices
   */
  static async getEligibleInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = req.query.branchId as string | undefined;
      const search = req.query.search as string | undefined;

      const invoices = await SalesReturnService.getEligibleInvoices(companyId, branchId, search);

      ApiResponse.success(res, invoices, 'Eligible invoices retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new sales return
   * POST /api/v1/sales-returns
   */
  static async createReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        invoiceId,
        returnReason,
        notes,
        branchId,
        isFullReturn,
        items,
      } = req.body;

      const user = (req as any).user;
      const companyId = user.companyId;

      if (!branchId) {
        throw new AppError(400, 'Branch ID is required');
      }

      if (!invoiceId) {
        throw new AppError(400, 'Invoice ID is required');
      }

      if (!returnReason) {
        throw new AppError(400, 'Return reason is required');
      }

      // Validate return reason
      const validReasons: SalesReturnReason[] = [
        'DEFECTIVE',
        'WRONG_ITEM',
        'CUSTOMER_CHANGED_MIND',
        'DUPLICATE_BILLING',
        'PRICE_ADJUSTMENT',
        'OTHER',
      ];
      if (!validReasons.includes(returnReason)) {
        throw new AppError(400, 'Invalid return reason');
      }

      // Validate items for partial return
      if (!isFullReturn && (!items || !Array.isArray(items) || items.length === 0)) {
        throw new AppError(400, 'Items are required for partial return');
      }

      const salesReturn = await SalesReturnService.createReturn({
        invoiceId,
        returnReason,
        notes,
        branchId,
        companyId,
        createdById: user.userId,
        isFullReturn: isFullReturn || false,
        items: items || [],
      });

      ApiResponse.created(res, salesReturn, 'Sales return created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sales return by ID
   * GET /api/v1/sales-returns/:id
   */
  static async getReturnById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = user.branchId || (req.query.branchId as string | undefined);

      const salesReturn = await SalesReturnService.getReturnById(id, companyId, branchId);

      ApiResponse.success(res, salesReturn, 'Sales return retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all returns for an invoice
   * GET /api/v1/sales-returns/invoice/:invoiceId
   */
  static async getReturnsByInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { invoiceId } = req.params;
      const user = (req as any).user;
      const companyId = user.companyId;

      const returns = await SalesReturnService.getReturnsByInvoice(invoiceId, companyId);

      ApiResponse.success(res, returns, 'Sales returns retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm a sales return
   * PUT /api/v1/sales-returns/:id/confirm
   */
  static async confirmReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = user.branchId || (req.query.branchId as string | undefined);

      const salesReturn = await SalesReturnService.confirmReturn(
        id,
        companyId,
        user.userId,
        branchId
      );

      ApiResponse.success(res, salesReturn, 'Sales return confirmed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a sales return
   * PUT /api/v1/sales-returns/:id/reject
   */
  static async rejectReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = user.branchId || (req.query.branchId as string | undefined);

      const salesReturn = await SalesReturnService.rejectReturn(
        id,
        companyId,
        reason,
        branchId
      );

      ApiResponse.success(res, salesReturn, 'Sales return rejected successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process refund for a confirmed return
   * POST /api/v1/sales-returns/:id/refund
   */
  static async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { paymentMethodId, referenceNumber, notes } = req.body;
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = user.branchId || (req.query.branchId as string | undefined);

      const result = await SalesReturnService.processRefund(
        id,
        companyId,
        user.userId,
        paymentMethodId,
        referenceNumber,
        notes,
        branchId
      );

      ApiResponse.success(res, result, 'Refund processed successfully');
    } catch (error) {
      next(error);
    }
  }
}
