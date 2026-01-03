import { Response } from 'express';
import JobSheetService from '../services/jobSheetService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class JobSheetController {
  /**
   * POST /api/v1/services/:id/jobsheet
   * Generate job sheet for a service
   * @body templateId - Optional template ID
   * @body format - Optional format: 'A4' | 'A5' | 'thermal' (default: 'A4')
   * @body copyType - Optional copy type: 'customer' | 'office' (default: 'customer')
   */
  static generateJobSheet = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id: serviceId } = req.params;
    const { templateId, format = 'A4', copyType = 'customer' } = req.body;
    const userId = req.user!.userId;

    const jobSheet = await JobSheetService.generateJobSheet({
      serviceId,
      userId,
      templateId,
      format,
      copyType,
    });

    return ApiResponse.created(res, jobSheet, 'Job sheet generated successfully');
  });

  /**
   * GET /api/v1/services/:id/jobsheet
   * Get job sheet for a service
   */
  static getJobSheetByServiceId = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { id: serviceId } = req.params;

      const jobSheet = await JobSheetService.getJobSheetByServiceId(serviceId);

      return ApiResponse.success(res, jobSheet, 'Job sheet retrieved successfully');
    }
  );

  /**
   * GET /api/v1/jobsheets/:id
   * Get job sheet by ID
   */
  static getJobSheetById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const jobSheet = await JobSheetService.getJobSheetById(id);

    return ApiResponse.success(res, jobSheet, 'Job sheet retrieved successfully');
  });

  /**
   * POST /api/v1/jobsheets/:id/regenerate
   * Regenerate job sheet PDF
   * @body format - Optional format: 'A4' | 'A5' | 'thermal' (default: 'A4')
   * @body copyType - Optional copy type: 'customer' | 'office' (default: 'customer')
   */
  static regenerateJobSheet = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { format = 'A4', copyType = 'customer' } = req.body;
    const userId = req.user!.userId;

    const jobSheet = await JobSheetService.regenerateJobSheet(id, userId, format, copyType);

    return ApiResponse.success(res, jobSheet, 'Job sheet regenerated successfully');
  });

  /**
   * GET /api/v1/jobsheets
   * Get all job sheets with filters
   */
  static getAllJobSheets = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    const filters: any = {
      companyId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    // Role-based filtering
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      // Branch users see only their branch job sheets
      filters.branchId = req.user!.branchId;
    }

    // Optional filters
    if (req.query.branchId) {
      filters.branchId = req.query.branchId as string;
    }

    const result = await JobSheetService.getJobSheets(filters);

    return ApiResponse.success(res, result, 'Job sheets retrieved successfully');
  });

  /**
   * GET /api/v1/jobsheets/:id/pdf
   * Download job sheet PDF
   */
  static downloadJobSheetPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const jobSheet = await JobSheetService.getJobSheetById(id);

    if (!jobSheet.pdfUrl) {
      return ApiResponse.error(res, 'PDF not available', 404);
    }

    // Return PDF URL for client to download
    return ApiResponse.success(
      res,
      { pdfUrl: jobSheet.pdfUrl },
      'PDF URL retrieved successfully'
    );
  });
}

export default JobSheetController;
