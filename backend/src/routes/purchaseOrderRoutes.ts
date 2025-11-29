import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { PurchaseOrderController } from '../controllers/purchaseOrderController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { param } from 'express-validator';
import {
  createPurchaseOrderValidation,
  updatePurchaseOrderValidation,
  receiveItemsValidation,
  updateStatusValidation,
} from '../validators/purchaseOrderValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const purchaseOrderIdValidation = [
  param('id').isUUID().withMessage('Invalid purchase order ID format'),
];

const supplierIdValidation = [
  param('supplierId').isUUID().withMessage('Invalid supplier ID format'),
];

/**
 * @route   GET /api/v1/purchase-orders/summary
 * @desc    Get purchase order summary statistics
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/summary',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  PurchaseOrderController.getPurchaseOrderSummary
);

/**
 * @route   GET /api/v1/purchase-orders/supplier/:supplierId/outstanding
 * @desc    Get supplier outstanding balance
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/supplier/:supplierId/outstanding',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  validate(supplierIdValidation),
  PurchaseOrderController.getSupplierOutstanding
);

/**
 * @route   POST /api/v1/purchase-orders
 * @desc    Create a new purchase order
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
  validate(createPurchaseOrderValidation),
  PurchaseOrderController.createPurchaseOrder
);

/**
 * @route   GET /api/v1/purchase-orders
 * @desc    Get all purchase orders with filters and pagination
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
  PurchaseOrderController.getAllPurchaseOrders
);

/**
 * @route   GET /api/v1/purchase-orders/:id
 * @desc    Get purchase order by ID
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
  validate(purchaseOrderIdValidation),
  PurchaseOrderController.getPurchaseOrderById
);

/**
 * @route   PUT /api/v1/purchase-orders/:id
 * @desc    Update purchase order
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
  validate([...purchaseOrderIdValidation, ...updatePurchaseOrderValidation]),
  PurchaseOrderController.updatePurchaseOrder
);

/**
 * @route   POST /api/v1/purchase-orders/:id/receive
 * @desc    Receive items for a purchase order
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post(
  '/:id/receive',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  validate([...purchaseOrderIdValidation, ...receiveItemsValidation]),
  PurchaseOrderController.receiveItems
);

/**
 * @route   PATCH /api/v1/purchase-orders/:id/status
 * @desc    Update purchase order status
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.patch(
  '/:id/status',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  validate([...purchaseOrderIdValidation, ...updateStatusValidation]),
  PurchaseOrderController.updateStatus
);

/**
 * @route   DELETE /api/v1/purchase-orders/:id
 * @desc    Delete purchase order
 * @access  Private (Admin, Branch Admin)
 */
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN),
  validate(purchaseOrderIdValidation),
  PurchaseOrderController.deletePurchaseOrder
);

export default router;
