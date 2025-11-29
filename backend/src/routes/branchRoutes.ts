import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { BranchController } from '../controllers/branchController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createBranchValidation,
  updateBranchValidation,
  branchIdValidation,
} from '../validators/branchValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/branches/list/simple
 * @desc    Get simplified list of branches for dropdowns
 * @access  Private (All authenticated users)
 */
router.get('/list/simple', BranchController.getBranchList);

/**
 * @route   GET /api/v1/branches/managers/available
 * @desc    Get available managers for branch assignment
 * @access  Private (Admin, Super Admin)
 */
router.get(
  '/managers/available',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BranchController.getAvailableManagers
);

/**
 * @route   POST /api/v1/branches
 * @desc    Create a new branch
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createBranchValidation),
  BranchController.createBranch
);

/**
 * @route   GET /api/v1/branches
 * @desc    Get all branches with filters and pagination
 * @access  Private (Admin, Super Admin, Manager)
 */
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  BranchController.getAllBranches
);

/**
 * @route   GET /api/v1/branches/:id/employees
 * @desc    Get all employees for a specific branch
 * @access  Private (Admin, Super Admin, Manager)
 */
router.get(
  '/:id/employees',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  BranchController.getBranchEmployees
);

/**
 * @route   GET /api/v1/branches/:id
 * @desc    Get branch by ID
 * @access  Private (Admin, Super Admin, Manager)
 */
router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  validate(branchIdValidation),
  BranchController.getBranchById
);

/**
 * @route   PUT /api/v1/branches/:id
 * @desc    Update branch
 * @access  Private (Admin, Super Admin)
 */
router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateBranchValidation),
  BranchController.updateBranch
);

/**
 * @route   DELETE /api/v1/branches/:id
 * @desc    Delete branch
 * @access  Private (Super Admin only)
 */
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN),
  validate(branchIdValidation),
  BranchController.deleteBranch
);

export default router;
