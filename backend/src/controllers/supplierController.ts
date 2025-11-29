import { Response } from 'express';
import { SupplierService } from '../services/supplierService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class SupplierController {
  /**
   * POST /api/v1/suppliers
   * Create a new supplier
   */
  static createSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
    const supplierData = req.body;
    const companyId = req.user!.companyId;
    const branchId = req.user!.branchId;

    // Ensure the supplier is created for the user's company and branch
    const supplier = await SupplierService.createSupplier({
      ...supplierData,
      companyId,
      branchId,
    });

    return ApiResponse.created(res, supplier, 'Supplier created successfully');
  });

  /**
   * GET /api/v1/suppliers
   * Get all suppliers with filters and pagination
   */
  static getAllSuppliers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.query.branchId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      companyId,
      branchId,
      search: req.query.search as string,
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
      page,
      limit,
    };

    const result = await SupplierService.getSuppliers(filters);

    return ApiResponse.success(res, result, 'Suppliers retrieved successfully');
  });

  /**
   * GET /api/v1/suppliers/dropdown
   * Get active suppliers for dropdown (minimal data)
   */
  static getSuppliersDropdown = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.query.branchId as string;

    const suppliers = await SupplierService.getActiveSuppliersDropdown(companyId, branchId);

    return ApiResponse.success(res, suppliers, 'Active suppliers retrieved successfully');
  });

  /**
   * GET /api/v1/suppliers/:id
   * Get supplier by ID
   */
  static getSupplierById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const supplier = await SupplierService.getSupplierById(id, companyId);

    return ApiResponse.success(res, supplier, 'Supplier retrieved successfully');
  });

  /**
   * PUT /api/v1/suppliers/:id
   * Update supplier
   */
  static updateSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const supplier = await SupplierService.updateSupplier(id, companyId, updateData);

    return ApiResponse.success(res, supplier, 'Supplier updated successfully');
  });

  /**
   * DELETE /api/v1/suppliers/:id
   * Delete supplier (soft delete if has associated inventory)
   */
  static deleteSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const result = await SupplierService.deleteSupplier(id, companyId);

    return ApiResponse.success(res, result.supplier, result.message);
  });
}
