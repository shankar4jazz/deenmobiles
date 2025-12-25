import { Response } from 'express';
import { PermissionService } from '../services/permissionService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class PermissionController {
  /**
   * GET /api/v1/permissions
   * Get all permissions
   */
  static getAllPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const permissions = await PermissionService.getAllPermissions();

    return ApiResponse.success(res, permissions, 'Permissions retrieved successfully');
  });

  /**
   * GET /api/v1/permissions/grouped
   * Get permissions grouped by resource
   */
  static getPermissionsGrouped = asyncHandler(async (req: AuthRequest, res: Response) => {
    const groupedPermissions = await PermissionService.getPermissionsGrouped();

    return ApiResponse.success(res, groupedPermissions, 'Grouped permissions retrieved successfully');
  });
}
