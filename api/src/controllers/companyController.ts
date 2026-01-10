import { Response } from 'express';
import { CompanyService } from '../services/companyService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class CompanyController {
  /**
   * GET /api/v1/company
   * Get current company details
   */
  static getCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const company = await CompanyService.getCompanyById(companyId);
    return ApiResponse.success(res, company, 'Company details retrieved successfully');
  });

  /**
   * PUT /api/v1/company
   * Update company details
   */
  static updateCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { name, email, phone, address, gstin, stateCode, jobSheetInstructions } = req.body;

    const company = await CompanyService.updateCompany(companyId, {
      name,
      email,
      phone,
      address,
      gstin,
      stateCode,
      jobSheetInstructions,
    });

    return ApiResponse.success(res, company, 'Company details updated successfully');
  });

  /**
   * POST /api/v1/company/logo
   * Upload company logo
   */
  static uploadLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;

    if (!req.body.logo) {
      return ApiResponse.badRequest(res, 'No logo file uploaded');
    }

    const company = await CompanyService.updateLogo(companyId, req.body.logo);
    return ApiResponse.success(res, company, 'Company logo uploaded successfully');
  });

  /**
   * DELETE /api/v1/company/logo
   * Delete company logo
   */
  static deleteLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const company = await CompanyService.deleteLogo(companyId);
    return ApiResponse.success(res, company, 'Company logo deleted successfully');
  });
}
