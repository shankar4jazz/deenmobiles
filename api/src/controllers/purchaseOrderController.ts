import { Response } from 'express';
import { PurchaseOrderService } from '../services/purchaseOrderService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { PurchaseOrderStatus } from '@prisma/client';

export class PurchaseOrderController {
  /**
   * POST /api/v1/purchase-orders
   * Create a new purchase order
   */
  static createPurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = req.body;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    const purchaseOrder = await PurchaseOrderService.createPurchaseOrder(
      {
        ...data,
        companyId,
      },
      userId
    );

    return ApiResponse.created(res, purchaseOrder, 'Purchase order created successfully');
  });

  /**
   * GET /api/v1/purchase-orders
   * Get all purchase orders with filters and pagination
   */
  static getAllPurchaseOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      companyId,
      branchId: req.query.branchId as string,
      supplierId: req.query.supplierId as string,
      status: req.query.status as PurchaseOrderStatus,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      search: req.query.search as string,
      page,
      limit,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await PurchaseOrderService.getPurchaseOrders(filters);

    return ApiResponse.success(res, result, 'Purchase orders retrieved successfully');
  });

  /**
   * GET /api/v1/purchase-orders/:id
   * Get purchase order by ID
   */
  static getPurchaseOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const purchaseOrder = await PurchaseOrderService.getPurchaseOrderById(id, companyId);

    return ApiResponse.success(res, purchaseOrder, 'Purchase order retrieved successfully');
  });

  /**
   * PUT /api/v1/purchase-orders/:id
   * Update purchase order
   */
  static updatePurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const updateData = req.body;

    const purchaseOrder = await PurchaseOrderService.updatePurchaseOrder(
      id,
      companyId,
      updateData,
      userId
    );

    return ApiResponse.success(res, purchaseOrder, 'Purchase order updated successfully');
  });

  /**
   * POST /api/v1/purchase-orders/:id/receive
   * Receive items for a purchase order
   */
  static receiveItems = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const receiveData = req.body;

    const purchaseOrder = await PurchaseOrderService.receiveItems(
      id,
      companyId,
      receiveData,
      userId
    );

    return ApiResponse.success(res, purchaseOrder, 'Items received successfully');
  });

  /**
   * PATCH /api/v1/purchase-orders/:id/status
   * Update purchase order status
   */
  static updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.user!.companyId;

    const purchaseOrder = await PurchaseOrderService.updateStatus(id, companyId, status);

    return ApiResponse.success(res, purchaseOrder, 'Purchase order status updated successfully');
  });

  /**
   * DELETE /api/v1/purchase-orders/:id
   * Delete purchase order
   */
  static deletePurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    await PurchaseOrderService.deletePurchaseOrder(id, companyId);

    return ApiResponse.success(res, null, 'Purchase order deleted successfully');
  });

  /**
   * GET /api/v1/purchase-orders/supplier/:supplierId/outstanding
   * Get supplier outstanding balance
   */
  static getSupplierOutstanding = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { supplierId } = req.params;
    const companyId = req.user!.companyId;
    const branchId = req.query.branchId as string;

    const outstanding = await PurchaseOrderService.getSupplierOutstanding(
      supplierId,
      companyId,
      branchId
    );

    return ApiResponse.success(res, outstanding, 'Supplier outstanding retrieved successfully');
  });

  /**
   * GET /api/v1/purchase-orders/summary
   * Get purchase order summary statistics
   */
  static getPurchaseOrderSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.query.branchId as string;

    const summary = await PurchaseOrderService.getPurchaseOrderSummary(companyId, branchId);

    return ApiResponse.success(res, summary, 'Purchase order summary retrieved successfully');
  });
}
