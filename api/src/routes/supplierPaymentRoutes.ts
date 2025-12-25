import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { SupplierPaymentController } from '../controllers/supplierPaymentController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { param } from 'express-validator';
import {
  createSupplierPaymentValidation,
  updateSupplierPaymentValidation,
} from '../validators/supplierPaymentValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const paymentIdValidation = [
  param('id').isUUID().withMessage('Invalid payment ID format'),
];

const supplierIdValidation = [
  param('supplierId').isUUID().withMessage('Invalid supplier ID format'),
];

/**
 * @route   GET /api/v1/supplier-payments/supplier/:supplierId/summary
 * @desc    Get supplier payment summary
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/supplier/:supplierId/summary',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  validate(supplierIdValidation),
  SupplierPaymentController.getSupplierPaymentSummary
);

/**
 * @route   POST /api/v1/supplier-payments
 * @desc    Create a new supplier payment
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
  validate(createSupplierPaymentValidation),
  SupplierPaymentController.createSupplierPayment
);

/**
 * @route   GET /api/v1/supplier-payments
 * @desc    Get all supplier payments with filters and pagination
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  SupplierPaymentController.getAllSupplierPayments
);

/**
 * @route   GET /api/v1/supplier-payments/:id
 * @desc    Get supplier payment by ID
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/:id',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  validate(paymentIdValidation),
  SupplierPaymentController.getSupplierPaymentById
);

/**
 * @route   PUT /api/v1/supplier-payments/:id
 * @desc    Update supplier payment
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
  validate([...paymentIdValidation, ...updateSupplierPaymentValidation]),
  SupplierPaymentController.updateSupplierPayment
);

/**
 * @route   DELETE /api/v1/supplier-payments/:id
 * @desc    Delete supplier payment
 * @access  Private (Admin, Branch Admin)
 */
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN),
  validate(paymentIdValidation),
  SupplierPaymentController.deleteSupplierPayment
);

export default router;
