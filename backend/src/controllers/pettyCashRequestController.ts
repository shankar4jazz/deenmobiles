import { Response } from 'express';
import { PettyCashRequestService } from '../services/pettyCashRequestService';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { PettyCashRequestStatus } from '@prisma/client';

// Petty Cash Request Controller - Handles all petty cash request operations
export class PettyCashRequestController {
  /**
   * @route   GET /api/v1/petty-cash-requests
   * @desc    Get all petty cash requests with filters
   * @access  Private (Super Admin, Admin, Branch Admin, Manager)
   */
  static getAllRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companyId } = req.user!;
    const {
      page,
      limit,
      search,
      branchId,
      requestedBy,
      status,
      startDate,
      endDate,
    } = req.query;

    const result = await PettyCashRequestService.getAllRequests({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      branchId: branchId as string,
      requestedBy: requestedBy as string,
      status: status as PettyCashRequestStatus,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * @route   GET /api/v1/petty-cash-requests/:id
   * @desc    Get petty cash request by ID
   * @access  Private (Super Admin, Admin, Branch Admin, Manager)
   */
  static getRequestById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;

    const request = await PettyCashRequestService.getRequestById(id, companyId);

    res.status(200).json({
      success: true,
      data: request,
    });
  });

  /**
   * @route   POST /api/v1/petty-cash-requests
   * @desc    Create a new petty cash request
   * @access  Private (Branch Admin, Manager)
   */
  static createRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companyId, userId, branchId } = req.user!;
    const { requestedAmount, reason } = req.body;

    const request = await PettyCashRequestService.createRequest({
      branchId: branchId!,
      requestedAmount: parseFloat(requestedAmount),
      reason,
      companyId,
      requestedBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Petty cash request created successfully',
      data: request,
    });
  });

  /**
   * @route   PUT /api/v1/petty-cash-requests/:id
   * @desc    Update petty cash request (only pending requests by requester)
   * @access  Private (Branch Admin, Manager - own requests only)
   */
  static updateRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId, userId } = req.user!;
    const { requestedAmount, reason } = req.body;

    const request = await PettyCashRequestService.updateRequest(id, companyId, userId, {
      requestedAmount: requestedAmount ? parseFloat(requestedAmount) : undefined,
      reason,
    });

    res.status(200).json({
      success: true,
      message: 'Petty cash request updated successfully',
      data: request,
    });
  });

  /**
   * @route   POST /api/v1/petty-cash-requests/:id/approve
   * @desc    Approve petty cash request and create transfer
   * @access  Private (Super Admin, Admin)
   */
  static approveRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId, userId } = req.user!;
    const {
      paymentMethodId,
      transactionRef,
      bankDetails,
      purpose,
      remarks,
      proofUrl,
    } = req.body;

    const result = await PettyCashRequestService.approveRequest(id, companyId, {
      approvedBy: userId,
      paymentMethodId,
      transactionRef,
      bankDetails,
      purpose,
      remarks,
      proofUrl,
    });

    res.status(200).json({
      success: true,
      message: 'Petty cash request approved and transfer created successfully',
      data: result,
    });
  });

  /**
   * @route   POST /api/v1/petty-cash-requests/:id/reject
   * @desc    Reject petty cash request
   * @access  Private (Super Admin, Admin)
   */
  static rejectRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId, userId } = req.user!;
    const { rejectedReason } = req.body;

    const request = await PettyCashRequestService.rejectRequest(id, companyId, {
      approvedBy: userId,
      rejectedReason,
    });

    res.status(200).json({
      success: true,
      message: 'Petty cash request rejected successfully',
      data: request,
    });
  });

  /**
   * @route   DELETE /api/v1/petty-cash-requests/:id
   * @desc    Cancel petty cash request (by requester)
   * @access  Private (Branch Admin, Manager - own requests only)
   */
  static cancelRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId, userId } = req.user!;

    const request = await PettyCashRequestService.cancelRequest(id, companyId, userId);

    res.status(200).json({
      success: true,
      message: 'Petty cash request cancelled successfully',
      data: request,
    });
  });

  /**
   * @route   GET /api/v1/petty-cash-requests/stats
   * @desc    Get request statistics
   * @access  Private (Super Admin, Admin)
   */
  static getRequestStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companyId } = req.user!;
    const { branchId } = req.query;

    const stats = await PettyCashRequestService.getRequestStats(
      companyId,
      branchId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  /**
   * @route   GET /api/v1/petty-cash-requests/my-requests
   * @desc    Get current user's branch petty cash requests
   * @access  Private (Branch Admin, Manager)
   */
  static getMyRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companyId, branchId } = req.user!;
    const { page, limit, search, status, startDate, endDate } = req.query;

    if (!branchId) {
      res.status(400).json({
        success: false,
        message: 'User is not assigned to any branch',
      });
      return;
    }

    const result = await PettyCashRequestService.getAllRequests({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      branchId: branchId,
      status: status as PettyCashRequestStatus,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
