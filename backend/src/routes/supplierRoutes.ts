import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { SupplierController } from '../controllers/supplierController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createSupplierValidation,
  updateSupplierValidation,
} from '../validators/supplierValidators';
import { param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const supplierIdValidation = [
  param('id').isUUID().withMessage('Invalid supplier ID format'),
];

/**
 * @route   GET /api/v1/suppliers/dropdown
 * @desc    Get active suppliers for dropdown (minimal data)
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/dropdown',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER,
    UserRole.SERVICE_ADMIN,
    UserRole.SERVICE_MANAGER
  ),
  SupplierController.getSuppliersDropdown
);

/**
 * @route   POST /api/v1/suppliers
 * @desc    Create a new supplier
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post(
  '/',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  validate(createSupplierValidation),
  SupplierController.createSupplier
);

/**
 * @route   GET /api/v1/suppliers
 * @desc    Get all suppliers with filters and pagination
 * @access  Private (Admin, Branch Admin, Manager, Service roles)
 */
router.get(
  '/',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER,
    UserRole.SERVICE_ADMIN,
    UserRole.SERVICE_MANAGER
  ),
  SupplierController.getAllSuppliers
);

/**
 * @route   GET /api/v1/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private (Admin, Branch Admin, Manager, Service roles)
 */
router.get(
  '/:id',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER,
    UserRole.SERVICE_ADMIN,
    UserRole.SERVICE_MANAGER
  ),
  validate(supplierIdValidation),
  SupplierController.getSupplierById
);

/**
 * @route   PUT /api/v1/suppliers/:id
 * @desc    Update supplier
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.put(
  '/:id',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  validate([...supplierIdValidation, ...updateSupplierValidation]),
  SupplierController.updateSupplier
);

/**
 * @route   DELETE /api/v1/suppliers/:id
 * @desc    Delete supplier (soft delete if has inventory)
 * @access  Private (Admin, Branch Admin)
 */
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN),
  validate(supplierIdValidation),
  SupplierController.deleteSupplier
);

export default router;
