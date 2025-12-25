import { Response } from 'express';
import { BranchService } from '../services/branchService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class BranchController {
  /**
   * POST /api/v1/branches
   * Create a new branch
   */
  static createBranch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const branchData = req.body;
    const companyId = req.user!.companyId;

    // Ensure the branch is created for the user's company
    const result = await BranchService.createBranch({
      ...branchData,
      companyId,
    });

    // Return with warning if manager was reassigned
    const message = result.warning
      ? `Branch created successfully. ${result.warning}`
      : 'Branch created successfully';

    return ApiResponse.created(res, result.branch, message);
  });

  /**
   * GET /api/v1/branches
   * Get all branches with filters and pagination
   */
  static getAllBranches = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      companyId,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      managerId: req.query.managerId as string,
    };

    const result = await BranchService.getAllBranches(filters, page, limit);

    return ApiResponse.success(res, result, 'Branches retrieved successfully');
  });

  /**
   * GET /api/v1/branches/:id
   * Get branch by ID
   */
  static getBranchById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const branch = await BranchService.getBranchById(id, companyId);

    return ApiResponse.success(res, branch, 'Branch retrieved successfully');
  });

  /**
   * PUT /api/v1/branches/:id
   * Update branch
   */
  static updateBranch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const result = await BranchService.updateBranch(id, companyId, updateData);

    // Return with warning if manager was reassigned
    const message = result.warning
      ? `Branch updated successfully. ${result.warning}`
      : 'Branch updated successfully';

    return ApiResponse.success(res, result.branch, message);
  });

  /**
   * DELETE /api/v1/branches/:id
   * Delete branch
   */
  static deleteBranch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const result = await BranchService.deleteBranch(id, companyId);

    return ApiResponse.success(res, result, 'Branch deleted successfully');
  });

  /**
   * GET /api/v1/branches/list/simple
   * Get simplified list of branches for dropdowns
   */
  static getBranchList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;

    const branches = await BranchService.getBranchesByCompany(companyId);

    return ApiResponse.success(res, branches, 'Branch list retrieved successfully');
  });

  /**
   * GET /api/v1/branches/managers/available
   * Get available managers for branch assignment
   */
  static getAvailableManagers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;

    const managers = await BranchService.getAvailableManagers(companyId);

    return ApiResponse.success(res, managers, 'Available managers retrieved successfully');
  });

  /**
   * GET /api/v1/branches/:id/employees
   * Get all employees for a specific branch
   */
  static getBranchEmployees = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const employees = await BranchService.getBranchEmployees(id, companyId);

    return ApiResponse.success(res, employees, 'Branch employees retrieved successfully');
  });
}
