import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { PermissionController } from '../controllers/permissionController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/permissions/grouped
 * @desc    Get permissions grouped by resource
 * @access  Private (Admin, Super Admin)
 */
router.get(
  '/grouped',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PermissionController.getPermissionsGrouped
);

/**
 * @route   GET /api/v1/permissions
 * @desc    Get all permissions
 * @access  Private (Admin, Super Admin)
 */
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PermissionController.getAllPermissions
);

export default router;
