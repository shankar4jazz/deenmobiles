import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { PettyCashTransferController } from '../controllers/pettyCashTransferController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { param } from 'express-validator';
import {
  createTransferValidator,
  updateTransferValidator,
} from '../validators/pettyCashTransferValidator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const idValidation = [param('id').isUUID().withMessage('Invalid ID format')];
const branchIdValidation = [param('branchId').isUUID().withMessage('Invalid branch ID format')];

// Authorize for Admin roles (Super Admin and Admin can manage transfers)
const adminRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

// Authorize for viewing (Admin, Branch Admin, Manager can view)
const viewRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.MANAGER,
];

// ==================== PETTY CASH TRANSFER ROUTES ====================

/**
 * @route   GET /api/v1/petty-cash-transfers
 * @desc    Get all petty cash transfers with filters
 * @access  Private (Super Admin, Admin, Branch Admin, Manager)
 */
router.get('/', authorize(...viewRoles), PettyCashTransferController.getAllTransfers);

/**
 * @route   GET /api/v1/petty-cash-transfers/stats
 * @desc    Get transfer statistics
 * @access  Private (Super Admin, Admin)
 */
router.get('/stats', authorize(...adminRoles), PettyCashTransferController.getTransferStats);

/**
 * @route   GET /api/v1/petty-cash-transfers/branch/:branchId/balance
 * @desc    Get branch petty cash balance
 * @access  Private (Super Admin, Admin, Branch Admin, Manager)
 */
router.get(
  '/branch/:branchId/balance',
  authorize(...viewRoles),
  validate(branchIdValidation),
  PettyCashTransferController.getBranchBalance
);

/**
 * @route   GET /api/v1/petty-cash-transfers/branch/:branchId/history
 * @desc    Get branch transfer history with pagination
 * @access  Private (Super Admin, Admin, Branch Admin, Manager)
 */
router.get(
  '/branch/:branchId/history',
  authorize(...viewRoles),
  validate(branchIdValidation),
  PettyCashTransferController.getBranchTransferHistory
);

/**
 * @route   GET /api/v1/petty-cash-transfers/:id
 * @desc    Get petty cash transfer by ID
 * @access  Private (Super Admin, Admin, Branch Admin, Manager)
 */
router.get(
  '/:id',
  authorize(...viewRoles),
  validate(idValidation),
  PettyCashTransferController.getTransferById
);

/**
 * @route   POST /api/v1/petty-cash-transfers
 * @desc    Create a new petty cash transfer
 * @access  Private (Super Admin, Admin)
 */
router.post(
  '/',
  authorize(...adminRoles),
  validate(createTransferValidator),
  PettyCashTransferController.createTransfer
);

/**
 * @route   PUT /api/v1/petty-cash-transfers/:id
 * @desc    Update petty cash transfer
 * @access  Private (Super Admin, Admin)
 */
router.put(
  '/:id',
  authorize(...adminRoles),
  validate([...idValidation, ...updateTransferValidator]),
  PettyCashTransferController.updateTransfer
);

/**
 * @route   DELETE /api/v1/petty-cash-transfers/:id
 * @desc    Cancel petty cash transfer
 * @access  Private (Super Admin, Admin)
 */
router.delete(
  '/:id',
  authorize(...adminRoles),
  validate(idValidation),
  PettyCashTransferController.cancelTransfer
);

export default router;
