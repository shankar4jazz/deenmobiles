import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { RoleController } from '../controllers/roleController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  assignPermissionsValidation,
  removePermissionsValidation,
} from '../validators/roleValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/roles/list/simple
 * @desc    Get simplified list of roles for dropdowns
 * @access  Private (Admin, Super Admin)
 */
router.get(
  '/list/simple',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  RoleController.getRolesList
);

/**
 * @route   POST /api/v1/roles
 * @desc    Create a new custom role
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createRoleValidation),
  RoleController.createRole
);

/**
 * @route   GET /api/v1/roles
 * @desc    Get all roles with filters and pagination
 * @access  Private (Admin, Super Admin)
 */
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  RoleController.getAllRoles
);

/**
 * @route   GET /api/v1/roles/:id
 * @desc    Get role by ID
 * @access  Private (Admin, Super Admin)
 */
router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(roleIdValidation),
  RoleController.getRoleById
);

/**
 * @route   PUT /api/v1/roles/:id
 * @desc    Update role
 * @access  Private (Admin, Super Admin)
 */
router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateRoleValidation),
  RoleController.updateRole
);

/**
 * @route   DELETE /api/v1/roles/:id
 * @desc    Delete role
 * @access  Private (Super Admin only)
 */
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN),
  validate(roleIdValidation),
  RoleController.deleteRole
);

/**
 * @route   POST /api/v1/roles/:id/permissions
 * @desc    Assign permissions to role
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/:id/permissions',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(assignPermissionsValidation),
  RoleController.assignPermissions
);

/**
 * @route   DELETE /api/v1/roles/:id/permissions
 * @desc    Remove permissions from role
 * @access  Private (Admin, Super Admin)
 */
router.delete(
  '/:id/permissions',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(removePermissionsValidation),
  RoleController.removePermissions
);

export default router;
