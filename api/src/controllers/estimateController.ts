import { Response } from 'express';
import EstimateService from '../services/estimateService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { EstimateStatus } from '@prisma/client';

export class EstimateController {
  /**
   * POST /api/v1/estimates
   * Create new estimate
   */
  static createEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { customerId, serviceId, items, subtotal, taxAmount, totalAmount, validUntil, notes, branchId: bodyBranchId } = req.body;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;
    const branchId = bodyBranchId || req.user!.branchId || '';

    const estimate = await EstimateService.createEstimate({
      customerId,
      serviceId,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      validUntil,
      notes,
      createdBy: userId,
      companyId,
      branchId,
    });

    return ApiResponse.created(res, estimate, 'Estimate created successfully');
  });

  /**
   * GET /api/v1/estimates
   * Get all estimates with filters
   */
  static getAllEstimates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    const filters: any = {
      companyId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    // Role-based filtering
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      // Branch users see only their branch estimates
      filters.branchId = req.user!.branchId;
    }

    // Optional filters
    if (req.query.branchId) {
      filters.branchId = req.query.branchId as string;
    }

    if (req.query.status) {
      filters.status = req.query.status as EstimateStatus;
    }

    if (req.query.customerId) {
      filters.customerId = req.query.customerId as string;
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

    const result = await EstimateService.getEstimates(filters);

    return ApiResponse.success(res, result, 'Estimates retrieved successfully');
  });

  /**
   * GET /api/v1/estimates/:id
   * Get estimate by ID
   */
  static getEstimateById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const estimate = await EstimateService.getEstimateById(id, companyId);

    return ApiResponse.success(res, estimate, 'Estimate retrieved successfully');
  });

  /**
   * PUT /api/v1/estimates/:id
   * Update estimate
   */
  static updateEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { items, subtotal, taxAmount, totalAmount, validUntil, notes } = req.body;
    const companyId = req.user!.companyId;

    const estimate = await EstimateService.updateEstimate(
      id,
      {
        items,
        subtotal,
        taxAmount,
        totalAmount,
        validUntil,
        notes,
      },
      companyId
    );

    return ApiResponse.success(res, estimate, 'Estimate updated successfully');
  });

  /**
   * DELETE /api/v1/estimates/:id
   * Delete estimate
   */
  static deleteEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    await EstimateService.deleteEstimate(id, companyId);

    return ApiResponse.success(res, null, 'Estimate deleted successfully');
  });

  /**
   * PUT /api/v1/estimates/:id/status
   * Update estimate status
   */
  static updateEstimateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.user!.companyId;

    const estimate = await EstimateService.updateEstimateStatus(id, status, companyId);

    return ApiResponse.success(res, estimate, 'Estimate status updated successfully');
  });

  /**
   * POST /api/v1/estimates/:id/send
   * Send estimate to customer
   */
  static sendEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { email } = req.body;
    const companyId = req.user!.companyId;

    const estimate = await EstimateService.sendEstimate(id, email, companyId);

    return ApiResponse.success(res, estimate, 'Estimate sent successfully');
  });

  /**
   * POST /api/v1/estimates/:id/approve
   * Approve estimate
   */
  static approveEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const estimate = await EstimateService.approveEstimate(id, companyId);

    return ApiResponse.success(res, estimate, 'Estimate approved successfully');
  });

  /**
   * POST /api/v1/estimates/:id/reject
   * Reject estimate
   */
  static rejectEstimate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const estimate = await EstimateService.rejectEstimate(id, companyId);

    return ApiResponse.success(res, estimate, 'Estimate rejected successfully');
  });

  /**
   * POST /api/v1/estimates/:id/convert
   * Convert estimate to invoice
   */
  static convertToInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    const result = await EstimateService.convertToInvoice(id, userId, companyId);

    return ApiResponse.created(res, result, 'Estimate converted to invoice successfully');
  });

  /**
   * POST /api/v1/estimates/:id/regenerate-pdf
   * Regenerate estimate PDF
   */
  static regeneratePDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const estimate = await EstimateService.regenerateEstimatePDF(id, companyId);

    return ApiResponse.success(res, estimate, 'Estimate PDF regenerated successfully');
  });

  /**
   * GET /api/v1/estimates/:id/pdf?format=A4|A5|thermal-2|thermal-3
   * Stream estimate PDF on-demand (no file saved)
   * Used for View operations
   */
  static getEstimatePDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const format = (req.query.format as string) || 'A4';

    // Validate format
    const validFormats = ['A4', 'A5', 'thermal-2', 'thermal-3'];
    if (!validFormats.includes(format)) {
      return ApiResponse.badRequest(res, 'Invalid format. Valid formats are: A4, A5, thermal-2, thermal-3');
    }

    // Stream PDF on-demand (no file saved)
    const { buffer, estimateNumber } = await EstimateService.streamEstimatePDF(id, companyId, format);

    // Set headers for PDF streaming
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="estimate_${estimateNumber}_${format}.pdf"`);
    res.setHeader('Content-Length', buffer.length);

    // Stream the buffer directly to response
    return res.send(buffer);
  });

  /**
   * GET /api/v1/estimates/:id/download?format=A4|A5|thermal-2|thermal-3
   * Download estimate PDF on-demand (no file saved)
   */
  static downloadEstimatePDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const format = (req.query.format as string) || 'A4';

    // Validate format
    const validFormats = ['A4', 'A5', 'thermal-2', 'thermal-3'];
    if (!validFormats.includes(format)) {
      return ApiResponse.badRequest(res, 'Invalid format. Valid formats are: A4, A5, thermal-2, thermal-3');
    }

    // Stream PDF on-demand (no file saved)
    const { buffer, estimateNumber } = await EstimateService.streamEstimatePDF(id, companyId, format);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="estimate_${estimateNumber}_${format}.pdf"`);
    res.setHeader('Content-Length', buffer.length);

    // Stream the buffer directly to response
    return res.send(buffer);
  });

  /**
   * POST /api/v1/estimates/:id/share
   * Get shareable estimate URL (for WhatsApp sharing)
   * Generates PDF and saves to storage
   * @body format - Optional format: 'A4' | 'A5' | 'thermal-2' | 'thermal-3' (default: 'A4')
   */
  static getShareableEstimateURL = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const { format = 'A4' } = req.body;

    const result = await EstimateService.getShareableEstimateURL(id, companyId, format);

    return ApiResponse.success(
      res,
      result,
      'Shareable estimate URL generated successfully'
    );
  });
}

export default EstimateController;
