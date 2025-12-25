import { Request, Response } from 'express';
import { PublicService } from '../services/publicService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';

export class PublicController {
  /**
   * GET /api/v1/public/track
   * Track service by ticket number or phone number
   * Returns customer-safe data only (no internal notes, passwords, etc.)
   */
  static trackService = asyncHandler(async (req: Request, res: Response) => {
    const { ticket, phone } = req.query;

    if (!ticket && !phone) {
      return ApiResponse.badRequest(res, 'Please provide ticket number or phone number');
    }

    const result = await PublicService.trackService(
      ticket as string | undefined,
      phone as string | undefined
    );

    // Determine message based on result type
    const message = Array.isArray(result)
      ? `Found ${result.length} service(s)`
      : 'Service retrieved successfully';

    return ApiResponse.success(res, result, message);
  });

  /**
   * GET /api/v1/public/company-info
   * Get basic company info for portal branding
   */
  static getCompanyInfo = asyncHandler(async (req: Request, res: Response) => {
    const companyInfo = await PublicService.getCompanyInfo();
    return ApiResponse.success(res, companyInfo, 'Company info retrieved');
  });
}
