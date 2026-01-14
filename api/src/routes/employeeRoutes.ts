import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { EmployeeController } from '../controllers/employeeController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { uploadProfileImage, processProfileImageUpload } from '../middleware/s3Upload';
import {
  createEmployeeValidation,
  updateEmployeeValidation,
  employeeIdValidation,
} from '../validators/employeeValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/employees/check-username
 * @desc    Check if username is available
 * @access  Private (Admin, Super Admin)
 */
router.get(
  '/check-username',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_ADMIN),
  EmployeeController.checkUsernameAvailability
);

/**
 * @route   GET /api/v1/employees/by-role
 * @desc    Get employees by role (for dropdowns)
 * @access  Private (Admin, Super Admin, Manager)
 */
router.get(
  '/by-role',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_ADMIN),
  EmployeeController.getEmployeesByRole
);

/**
 * @route   POST /api/v1/employees
 * @desc    Create a new employee
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_ADMIN),
  uploadProfileImage,
  processProfileImageUpload('employees'),
  validate(createEmployeeValidation),
  EmployeeController.createEmployee
);

/**
 * @route   GET /api/v1/employees
 * @desc    Get all employees with filters and pagination
 * @access  Private (Admin, Super Admin, Manager)
 */
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_ADMIN),
  EmployeeController.getAllEmployees
);

/**
 * @route   GET /api/v1/employees/:id
 * @desc    Get employee by ID
 * @access  Private (Admin, Super Admin, Manager)
 */
router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_ADMIN),
  validate(employeeIdValidation),
  EmployeeController.getEmployeeById
);

/**
 * @route   PUT /api/v1/employees/:id
 * @desc    Update employee
 * @access  Private (Admin, Super Admin)
 */
router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_ADMIN),
  uploadProfileImage,
  processProfileImageUpload('employees'),
  validate(updateEmployeeValidation),
  EmployeeController.updateEmployee
);

/**
 * @route   DELETE /api/v1/employees/:id
 * @desc    Delete employee
 * @access  Private (Super Admin only)
 */
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN),
  validate(employeeIdValidation),
  EmployeeController.deleteEmployee
);

/**
 * @route   POST /api/v1/employees/:id/add-to-branch
 * @desc    Add an existing employee to a branch
 * @access  Private (Admin, Super Admin, Manager)
 */
router.post(
  '/:id/add-to-branch',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_ADMIN),
  EmployeeController.addEmployeeToBranch
);

/**
 * @route   PUT /api/v1/employees/:id/transfer
 * @desc    Transfer employee to a different branch
 * @access  Private (Admin, Super Admin, Manager)
 */
router.put(
  '/:id/transfer',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_ADMIN),
  EmployeeController.transferEmployee
);

/**
 * @route   DELETE /api/v1/employees/:id/remove-from-branch
 * @desc    Remove employee from their current branch
 * @access  Private (Admin, Super Admin, Manager)
 */
router.delete(
  '/:id/remove-from-branch',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_ADMIN),
  EmployeeController.removeEmployeeFromBranch
);

export default router;
