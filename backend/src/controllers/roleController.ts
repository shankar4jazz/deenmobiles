import { Response } from 'express';
import { RoleService } from '../services/roleService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class RoleController {
  /**
   * POST /api/v1/roles
   * Create a new custom role
   */
  static createRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const roleData = req.body;
    const companyId = req.user!.companyId;

    const role = await RoleService.createRole({
      ...roleData,
      companyId,
    });

    return ApiResponse.created(res, role, 'Role created successfully');
  });

  /**
   * GET /api/v1/roles
   * Get all roles with filters and pagination
   */
  static getAllRoles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      companyId,
      search: req.query.search as string,
      includeSystem: req.query.includeSystem !== 'false',
    };

    const result = await RoleService.getAllRoles(filters, page, limit);

    return ApiResponse.success(res, result, 'Roles retrieved successfully');
  });

  /**
   * GET /api/v1/roles/list/simple
   * Get simplified list of roles for dropdowns
   */
  static getRolesList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;

    const roles = await RoleService.getRolesList(companyId);

    return ApiResponse.success(res, roles, 'Roles list retrieved successfully');
  });

  /**
   * GET /api/v1/roles/:id
   * Get role by ID
   */
  static getRoleById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const role = await RoleService.getRoleById(id, companyId);

    return ApiResponse.success(res, role, 'Role retrieved successfully');
  });

  /**
   * PUT /api/v1/roles/:id
   * Update role
   */
  static updateRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const role = await RoleService.updateRole(id, companyId, updateData);

    return ApiResponse.success(res, role, 'Role updated successfully');
  });

  /**
   * DELETE /api/v1/roles/:id
   * Delete role
   */
  static deleteRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const result = await RoleService.deleteRole(id, companyId);

    return ApiResponse.success(res, result, 'Role deleted successfully');
  });

  /**
   * POST /api/v1/roles/:id/permissions
   * Assign permissions to role
   */
  static assignPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const { permissionIds } = req.body;

    const role = await RoleService.assignPermissions(id, companyId, permissionIds);

    return ApiResponse.success(res, role, 'Permissions assigned successfully');
  });

  /**
   * DELETE /api/v1/roles/:id/permissions
   * Remove permissions from role
   */
  static removePermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const { permissionIds } = req.body;

    const role = await RoleService.removePermissions(id, companyId, permissionIds);

    return ApiResponse.success(res, role, 'Permissions removed successfully');
  });
}
