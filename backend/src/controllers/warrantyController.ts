import { Response } from 'express';
import { AuthRequest } from '../types';
import { WarrantyService } from '../services/warrantyService';
import { ApiResponse } from '../utils/response';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export class WarrantyController {
  /**
   * Check warranty status for a customer and item
   */
  static checkWarranty = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { customerId, itemId } = req.query;

    if (!customerId || !itemId) {
      throw new AppError(400, 'Both customerId and itemId are required');
    }

    const result = await WarrantyService.checkWarrantyStatus(
      customerId as string,
      itemId as string,
      companyId
    );

    return ApiResponse.success(res, result);
  });

  /**
   * Get all active warranties for a customer
   */
  static getCustomerWarranties = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { customerId } = req.params;

    if (!customerId) {
      throw new AppError(400, 'Customer ID is required');
    }

    const warranties = await WarrantyService.getActiveWarrantiesForCustomer(
      customerId,
      companyId
    );

    return ApiResponse.success(res, warranties);
  });

  /**
   * Get warranty by ID
   */
  static getWarrantyById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const warranty = await WarrantyService.getWarrantyById(id, companyId);

    return ApiResponse.success(res, warranty);
  });

  /**
   * Search warranties with filters
   */
  static searchWarranties = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const {
      customerId,
      itemId,
      branchId,
      status,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const result = await WarrantyService.searchWarranties({
      companyId,
      customerId: customerId as string,
      itemId: itemId as string,
      branchId: branchId as string,
      status: status as 'ACTIVE' | 'EXPIRED' | 'CLAIMED' | 'ALL',
      dateRange: startDate && endDate
        ? {
            start: new Date(startDate as string),
            end: new Date(endDate as string),
          }
        : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return ApiResponse.success(res, result);
  });

  /**
   * Get warranty statistics
   */
  static getWarrantyStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { branchId } = req.query;

    const stats = await WarrantyService.getWarrantyStats(
      companyId,
      branchId as string | undefined
    );

    return ApiResponse.success(res, stats);
  });

  /**
   * Get warranties for a service
   */
  static getServiceWarranties = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { serviceId } = req.params;

    const warranties = await WarrantyService.getServiceWarranties(serviceId);

    return ApiResponse.success(res, warranties);
  });

  /**
   * Get warranties for an invoice
   */
  static getInvoiceWarranties = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { invoiceId } = req.params;

    const warranties = await WarrantyService.getInvoiceWarranties(invoiceId);

    return ApiResponse.success(res, warranties);
  });

  /**
   * Mark warranty as claimed
   */
  static markWarrantyClaimed = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { claimServiceId, claimReason } = req.body;

    if (!claimServiceId || !claimReason) {
      throw new AppError(400, 'Claim service ID and reason are required');
    }

    const warranty = await WarrantyService.markWarrantyClaimed(
      id,
      claimServiceId,
      claimReason,
      companyId
    );

    return ApiResponse.success(res, warranty, 'Warranty marked as claimed');
  });

  /**
   * Get warranty label/display text for an item
   */
  static getWarrantyLabel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { warrantyDays, warrantyType } = req.query;

    const label = WarrantyService.getWarrantyLabel(
      parseInt(warrantyDays as string) || 0,
      warrantyType as string | undefined
    );

    return ApiResponse.success(res, { label });
  });
}
