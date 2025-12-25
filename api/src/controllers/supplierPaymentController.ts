import { Response } from 'express';
import { SupplierPaymentService } from '../services/supplierPaymentService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class SupplierPaymentController {
  /**
   * POST /api/v1/supplier-payments
   * Create a new supplier payment
   */
  static createSupplierPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = req.body;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    const payment = await SupplierPaymentService.createSupplierPayment(
      {
        ...data,
        companyId,
      },
      userId
    );

    return ApiResponse.created(res, payment, 'Supplier payment created successfully');
  });

  /**
   * GET /api/v1/supplier-payments
   * Get all supplier payments with filters and pagination
   */
  static getAllSupplierPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const filters = {
      companyId,
      branchId: req.query.branchId as string,
      supplierId: req.query.supplierId as string,
      purchaseOrderId: req.query.purchaseOrderId as string,
      paymentMethodId: req.query.paymentMethodId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page,
      limit,
      sortBy: (req.query.sortBy as string) || 'paymentDate',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await SupplierPaymentService.getSupplierPayments(filters);

    return ApiResponse.success(res, result, 'Supplier payments retrieved successfully');
  });

  /**
   * GET /api/v1/supplier-payments/:id
   * Get supplier payment by ID
   */
  static getSupplierPaymentById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const payment = await SupplierPaymentService.getSupplierPaymentById(id, companyId);

    return ApiResponse.success(res, payment, 'Supplier payment retrieved successfully');
  });

  /**
   * GET /api/v1/supplier-payments/supplier/:supplierId/summary
   * Get supplier payment summary
   */
  static getSupplierPaymentSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { supplierId } = req.params;
    const companyId = req.user!.companyId;
    const branchId = req.query.branchId as string;

    const summary = await SupplierPaymentService.getSupplierPaymentSummary(
      supplierId,
      companyId,
      branchId
    );

    return ApiResponse.success(res, summary, 'Supplier payment summary retrieved successfully');
  });

  /**
   * PUT /api/v1/supplier-payments/:id
   * Update supplier payment
   */
  static updateSupplierPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const payment = await SupplierPaymentService.updateSupplierPayment(id, companyId, updateData);

    return ApiResponse.success(res, payment, 'Supplier payment updated successfully');
  });

  /**
   * DELETE /api/v1/supplier-payments/:id
   * Delete supplier payment
   */
  static deleteSupplierPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    await SupplierPaymentService.deleteSupplierPayment(id, companyId);

    return ApiResponse.success(res, null, 'Supplier payment deleted successfully');
  });
}
