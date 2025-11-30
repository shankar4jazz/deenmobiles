import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { InventoryController } from '../controllers/inventoryController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createInventoryValidation,
  updateInventoryValidation,
  stockAdjustmentValidation,
} from '../validators/inventoryValidators';
import { param } from 'express-validator';
import { uploadBillAttachment, processBillAttachmentUpload } from '../middleware/s3Upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const inventoryIdValidation = [
  param('id').isUUID().withMessage('Invalid inventory ID format'),
];

/**
 * @route   GET /api/v1/inventory/export/excel
 * @desc    Export inventory to Excel
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/export/excel',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  InventoryController.exportToExcel
);

/**
 * @route   GET /api/v1/inventory/export/csv
 * @desc    Export inventory to CSV
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/export/csv',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  InventoryController.exportToCSV
);

/**
 * @route   GET /api/v1/inventory/export/pdf
 * @desc    Export inventory to PDF
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/export/pdf',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  InventoryController.exportToPDF
);

/**
 * @route   GET /api/v1/inventory/low-stock
 * @desc    Get low stock items
 * @access  Private (Admin, Branch Admin, Manager, Service roles)
 */
router.get(
  '/low-stock',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER,
    UserRole.SERVICE_ADMIN,
    UserRole.SERVICE_MANAGER
  ),
  InventoryController.getLowStockItems
);

/**
 * @route   GET /api/v1/inventory/movements/all
 * @desc    Get all stock movements with filters
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/movements/all',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  InventoryController.getAllStockMovements
);

/**
 * @route   POST /api/v1/inventory
 * @desc    Create a new inventory item
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
  uploadBillAttachment,
  processBillAttachmentUpload(),
  validate(createInventoryValidation),
  InventoryController.createInventory
);

/**
 * @route   GET /api/v1/inventory
 * @desc    Get all inventory items with filters and pagination
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
    UserRole.SERVICE_MANAGER,
    UserRole.TECHNICIAN
  ),
  InventoryController.getAllInventory
);

/**
 * @route   GET /api/v1/inventory/:id
 * @desc    Get inventory item by ID
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
    UserRole.SERVICE_MANAGER,
    UserRole.TECHNICIAN
  ),
  validate(inventoryIdValidation),
  InventoryController.getInventoryById
);

/**
 * @route   PUT /api/v1/inventory/:id
 * @desc    Update inventory item
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
  uploadBillAttachment,
  processBillAttachmentUpload(),
  validate([...inventoryIdValidation, ...updateInventoryValidation]),
  InventoryController.updateInventory
);

/**
 * @route   POST /api/v1/inventory/:id/adjust-stock
 * @desc    Adjust stock quantity
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post(
  '/:id/adjust-stock',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  validate([...inventoryIdValidation, ...stockAdjustmentValidation]),
  InventoryController.adjustStock
);

/**
 * @route   GET /api/v1/inventory/:id/movements
 * @desc    Get stock movement history for an inventory item
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/:id/movements',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.MANAGER
  ),
  validate(inventoryIdValidation),
  InventoryController.getStockMovementHistory
);

/**
 * @route   DELETE /api/v1/inventory/:id
 * @desc    Delete inventory item (soft delete if has movements)
 * @access  Private (Admin, Branch Admin)
 */
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN),
  validate(inventoryIdValidation),
  InventoryController.deleteInventory
);

export default router;
