import { Response } from 'express';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import cashSettlementService from '../services/cashSettlementService';
import { CashSettlementStatus } from '@prisma/client';

export class CashSettlementController {
  /**
   * POST /api/v1/cash-settlements
   * Create or get today's settlement
   */
  static createSettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    let branchId = req.body.branchId as string;
    const settlementDate = req.body.settlementDate
      ? new Date(req.body.settlementDate)
      : new Date();

    // Use user's branch if not admin
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required');
    }

    const settlement = await cashSettlementService.createOrGetSettlement(
      companyId,
      branchId,
      settlementDate,
      userId
    );

    return ApiResponse.success(res, settlement, 'Settlement retrieved successfully');
  });

  /**
   * GET /api/v1/cash-settlements/today
   * Get today's settlement
   */
  static getTodaySettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string;

    // Use user's branch if not admin
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required');
    }

    const settlement = await cashSettlementService.createOrGetSettlement(
      companyId,
      branchId,
      new Date(),
      userId
    );

    return ApiResponse.success(res, settlement, 'Today\'s settlement retrieved successfully');
  });

  /**
   * GET /api/v1/cash-settlements
   * Get settlements list
   */
  static getSettlements = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Use user's branch if not admin
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const filters = {
      companyId,
      branchId,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      status: req.query.status as CashSettlementStatus | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await cashSettlementService.getSettlements(filters);

    return ApiResponse.success(res, result, 'Settlements retrieved successfully');
  });

  /**
   * GET /api/v1/cash-settlements/:id
   * Get settlement by ID
   */
  static getSettlementById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const settlement = await cashSettlementService.getSettlementById(id, companyId);

    if (!settlement) {
      return ApiResponse.notFound(res, 'Settlement not found');
    }

    return ApiResponse.success(res, settlement, 'Settlement retrieved successfully');
  });

  /**
   * PUT /api/v1/cash-settlements/:id/denominations
   * Update cash denominations
   */
  static updateDenominations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const denominationData = {
      note2000Count: parseInt(req.body.note2000Count) || 0,
      note500Count: parseInt(req.body.note500Count) || 0,
      note200Count: parseInt(req.body.note200Count) || 0,
      note100Count: parseInt(req.body.note100Count) || 0,
      note50Count: parseInt(req.body.note50Count) || 0,
      note20Count: parseInt(req.body.note20Count) || 0,
      note10Count: parseInt(req.body.note10Count) || 0,
      coin5Count: parseInt(req.body.coin5Count) || 0,
      coin2Count: parseInt(req.body.coin2Count) || 0,
      coin1Count: parseInt(req.body.coin1Count) || 0,
    };

    const settlement = await cashSettlementService.updateDenominations(id, companyId, denominationData);

    return ApiResponse.success(res, settlement, 'Denominations updated successfully');
  });

  /**
   * PUT /api/v1/cash-settlements/:id/notes
   * Update settlement notes
   */
  static updateNotes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { notes } = req.body;

    const settlement = await cashSettlementService.updateNotes(id, companyId, notes || '');

    return ApiResponse.success(res, settlement, 'Notes updated successfully');
  });

  /**
   * POST /api/v1/cash-settlements/:id/submit
   * Submit settlement for verification
   */
  static submitSettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { id } = req.params;

    const settlement = await cashSettlementService.submitSettlement(id, companyId, userId);

    return ApiResponse.success(res, settlement, 'Settlement submitted for verification');
  });

  /**
   * POST /api/v1/cash-settlements/:id/verify
   * Verify settlement (Manager/Admin only)
   */
  static verifySettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const verifiedById = req.user!.userId;
    const { id } = req.params;
    const { notes } = req.body;

    const settlement = await cashSettlementService.verifySettlement(id, companyId, verifiedById, notes);

    return ApiResponse.success(res, settlement, 'Settlement verified successfully');
  });

  /**
   * POST /api/v1/cash-settlements/:id/reject
   * Reject settlement (Manager/Admin only)
   */
  static rejectSettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const rejectedById = req.user!.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return ApiResponse.badRequest(res, 'Rejection reason is required');
    }

    const settlement = await cashSettlementService.rejectSettlement(id, companyId, rejectedById, reason);

    return ApiResponse.success(res, settlement, 'Settlement rejected');
  });
}
