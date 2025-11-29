import { Response } from 'express';
import { PettyCashTransferService } from '../services/pettyCashTransferService';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { PettyCashTransferStatus } from '@prisma/client';

export class PettyCashTransferController {
  /**
   * @route   GET /api/v1/petty-cash-transfers
   * @desc    Get all petty cash transfers with filters
   * @access  Private (Super Admin, Admin, Branch Admin, Manager)
   */
  static getAllTransfers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companyId } = req.user!;
    const {
      page,
      limit,
      search,
      branchId,
      employeeId,
      status,
      startDate,
      endDate,
    } = req.query;

    const result = await PettyCashTransferService.getAllTransfers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      branchId: branchId as string,
      employeeId: employeeId as string,
      status: status as PettyCashTransferStatus,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * @route   GET /api/v1/petty-cash-transfers/:id
   * @desc    Get petty cash transfer by ID
   * @access  Private (Super Admin, Admin, Branch Admin, Manager)
   */
  static getTransferById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;

    const transfer = await PettyCashTransferService.getTransferById(id, companyId);

    res.status(200).json({
      success: true,
      data: transfer,
    });
  });

  /**
   * @route   POST /api/v1/petty-cash-transfers
   * @desc    Create a new petty cash transfer
   * @access  Private (Super Admin, Admin)
   */
  static createTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companyId, userId } = req.user!;
    const {
      branchId,
      employeeId,
      amount,
      transferDate,
      paymentMethodId,
      transactionRef,
      bankDetails,
      purpose,
      remarks,
      proofUrl,
    } = req.body;

    const transfer = await PettyCashTransferService.createTransfer({
      branchId,
      employeeId,
      amount: parseFloat(amount),
      transferDate: transferDate ? new Date(transferDate) : undefined,
      paymentMethodId,
      transactionRef,
      bankDetails,
      purpose,
      remarks,
      proofUrl,
      companyId,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Petty cash transfer created successfully',
      data: transfer,
    });
  });

  /**
   * @route   PUT /api/v1/petty-cash-transfers/:id
   * @desc    Update petty cash transfer
   * @access  Private (Super Admin, Admin)
   */
  static updateTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;
    const {
      amount,
      transferDate,
      paymentMethodId,
      transactionRef,
      bankDetails,
      purpose,
      remarks,
      proofUrl,
      status,
    } = req.body;

    const transfer = await PettyCashTransferService.updateTransfer(id, companyId, {
      amount: amount ? parseFloat(amount) : undefined,
      transferDate: transferDate ? new Date(transferDate) : undefined,
      paymentMethodId,
      transactionRef,
      bankDetails,
      purpose,
      remarks,
      proofUrl,
      status,
    });

    res.status(200).json({
      success: true,
      message: 'Petty cash transfer updated successfully',
      data: transfer,
    });
  });

  /**
   * @route   DELETE /api/v1/petty-cash-transfers/:id
   * @desc    Cancel petty cash transfer
   * @access  Private (Super Admin, Admin)
   */
  static cancelTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;

    const transfer = await PettyCashTransferService.cancelTransfer(id, companyId);

    res.status(200).json({
      success: true,
      message: 'Petty cash transfer cancelled successfully',
      data: transfer,
    });
  });

  /**
   * @route   GET /api/v1/petty-cash-transfers/branch/:branchId/balance
   * @desc    Get branch petty cash balance
   * @access  Private (Super Admin, Admin, Branch Admin, Manager)
   */
  static getBranchBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { branchId } = req.params;
    const { companyId } = req.user!;

    const balance = await PettyCashTransferService.getBranchBalance(branchId, companyId);

    res.status(200).json({
      success: true,
      data: balance,
    });
  });

  /**
   * @route   GET /api/v1/petty-cash-transfers/branch/:branchId/history
   * @desc    Get branch transfer history with pagination
   * @access  Private (Super Admin, Admin, Branch Admin, Manager)
   */
  static getBranchTransferHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { branchId } = req.params;
    const { companyId } = req.user!;
    const { page, limit, startDate, endDate } = req.query;

    const result = await PettyCashTransferService.getBranchTransferHistory(branchId, companyId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * @route   GET /api/v1/petty-cash-transfers/stats
   * @desc    Get transfer statistics
   * @access  Private (Super Admin, Admin)
   */
  static getTransferStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companyId } = req.user!;
    const { branchId } = req.query;

    const stats = await PettyCashTransferService.getTransferStats(
      companyId,
      branchId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}
