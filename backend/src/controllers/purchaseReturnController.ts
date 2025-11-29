import { Request, Response, NextFunction } from 'express';
import { PurchaseReturnService } from '../services/purchaseReturnService';
import { ApiResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export class PurchaseReturnController {
  /**
   * Get all returns for a company
   * GET /api/v1/purchase-returns
   */
  static async getAllReturns(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = req.query.branchId as string | undefined;

      const returns = await PurchaseReturnService.getAllReturns(companyId, branchId);

      ApiResponse.success(res, returns, 'Purchase returns retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new purchase return
   * POST /api/v1/purchase-returns
   */
  static async createReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        purchaseOrderItemId,
        returnQty,
        returnReason,
        returnType,
        notes,
        branchId,
      } = req.body;

      const user = (req as any).user;
      const companyId = user.companyId;

      if (!branchId) {
        throw new AppError(400, 'Branch ID is required');
      }

      if (!purchaseOrderItemId || !returnQty || !returnReason || !returnType) {
        throw new AppError(400, 'Missing required fields');
      }

      if (!['REFUND', 'REPLACEMENT'].includes(returnType)) {
        throw new AppError(400, 'Invalid return type. Must be REFUND or REPLACEMENT');
      }

      const purchaseReturn = await PurchaseReturnService.createReturn({
        purchaseOrderItemId,
        returnQty: parseFloat(returnQty),
        returnReason,
        returnType,
        notes,
        branchId,
        companyId,
        createdBy: user.userId,
      });

      ApiResponse.created(res, purchaseReturn, 'Purchase return created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get return by ID
   * GET /api/v1/purchase-returns/:id
   */
  static async getReturnById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = user.branchId || (req.query.branchId as string | undefined);

      const purchaseReturn = await PurchaseReturnService.getReturnById(id, companyId, branchId);

      ApiResponse.success(res, purchaseReturn, 'Purchase return retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all returns for a purchase order
   * GET /api/v1/purchase-orders/:poId/returns
   */
  static async getReturnsByPO(req: Request, res: Response, next: NextFunction) {
    try {
      const { poId } = req.params;
      const user = (req as any).user;
      const companyId = user.companyId;

      const returns = await PurchaseReturnService.getReturnsByPurchaseOrder(poId, companyId);

      ApiResponse.success(res, returns, 'Purchase returns retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm a purchase return
   * PUT /api/v1/purchase-returns/:id/confirm
   */
  static async confirmReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = user.branchId || (req.query.branchId as string | undefined);

      const purchaseReturn = await PurchaseReturnService.confirmReturn(
        id,
        companyId,
        user.userId,
        branchId
      );

      ApiResponse.success(res, purchaseReturn, 'Purchase return confirmed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a purchase return
   * PUT /api/v1/purchase-returns/:id/reject
   */
  static async rejectReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = user.branchId || (req.query.branchId as string | undefined);

      const purchaseReturn = await PurchaseReturnService.rejectReturn(
        id,
        companyId,
        reason,
        branchId
      );

      ApiResponse.success(res, purchaseReturn, 'Purchase return rejected successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process refund for a confirmed return
   * POST /api/v1/purchase-returns/:id/process-refund
   */
  static async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { paymentMethodId, referenceNumber, notes } = req.body;
      const user = (req as any).user;
      const companyId = user.companyId;
      const branchId = user.branchId || (req.query.branchId as string | undefined);

      const result = await PurchaseReturnService.processRefund(
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
