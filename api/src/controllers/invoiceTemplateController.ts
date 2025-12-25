import { Response } from 'express';
import InvoiceTemplateService from '../services/invoiceTemplateService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class InvoiceTemplateController {
  /**
   * POST /api/v1/invoice-templates
   * Create new invoice template
   */
  static createTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, notes, taxRate, items, branchId } = req.body;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    const template = await InvoiceTemplateService.createTemplate({
      name,
      description,
      notes,
      taxRate,
      items,
      companyId,
      branchId,
      userId,
    });

    return ApiResponse.created(res, template, 'Invoice template created successfully');
  });

  /**
   * GET /api/v1/invoice-templates
   * Get all invoice templates with filters
   */
  static getAllTemplates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    const filters: any = {
      companyId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    // Role-based filtering
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      // Branch users see only their branch templates
      filters.branchId = req.user!.branchId;
    }

    // Optional filters
    if (req.query.branchId) {
      filters.branchId = req.query.branchId as string;
    }

    if (req.query.isActive) {
      filters.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
      filters.searchTerm = req.query.search as string;
    }

    const result = await InvoiceTemplateService.getAllTemplates(filters);

    return ApiResponse.success(res, result);
  });

  /**
   * GET /api/v1/invoice-templates/:id
   * Get invoice template by ID
   */
  static getTemplateById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const template = await InvoiceTemplateService.getTemplateById(id, companyId);

    return ApiResponse.success(res, template);
  });

  /**
   * PUT /api/v1/invoice-templates/:id
   * Update invoice template
   */
  static updateTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const { name, description, notes, taxRate, isActive, items } = req.body;

    const template = await InvoiceTemplateService.updateTemplate(id, companyId, {
      name,
      description,
      notes,
      taxRate,
      isActive,
      items,
    });

    return ApiResponse.success(res, template, 'Invoice template updated successfully');
  });

  /**
   * DELETE /api/v1/invoice-templates/:id
   * Delete invoice template
   */
  static deleteTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    await InvoiceTemplateService.deleteTemplate(id, companyId);

    return ApiResponse.success(res, null, 'Invoice template deleted successfully');
  });

  /**
   * PATCH /api/v1/invoice-templates/:id/toggle-status
   * Toggle template active status
   */
  static toggleTemplateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const template = await InvoiceTemplateService.toggleTemplateStatus(id, companyId);

    return ApiResponse.success(
      res,
      template,
      `Template ${template.isActive ? 'activated' : 'deactivated'} successfully`
    );
  });
}

export default InvoiceTemplateController;
