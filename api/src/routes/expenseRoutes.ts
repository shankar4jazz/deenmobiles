import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ExpenseController } from '../controllers/expenseController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { param } from 'express-validator';
import { createExpenseValidator, updateExpenseValidator } from '../validators/expenseValidator';
import { uploadExpenseAttachment, processExpenseAttachmentUpload } from '../middleware/s3Upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const idValidation = [param('id').isUUID().withMessage('Invalid ID format')];
const branchIdValidation = [param('branchId').isUUID().withMessage('Invalid branch ID format')];

// Admin roles (can view all)
const adminRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

// Branch roles (can create and manage expenses)
const branchRoles = [UserRole.BRANCH_ADMIN, UserRole.MANAGER];

// All roles that can view
const viewRoles = [...adminRoles, ...branchRoles];

// ==================== EXPENSE ROUTES ====================

/**
 * @route   GET /api/v1/expenses
 * @desc    Get all expenses with filters
 * @access  Private (All roles)
 */
router.get('/', authorize(...viewRoles), ExpenseController.getAllExpenses);

/**
 * @route   GET /api/v1/expenses/stats
 * @desc    Get expense statistics
 * @access  Private (All roles)
 */
router.get('/stats', authorize(...viewRoles), ExpenseController.getExpenseStats);

/**
 * @route   GET /api/v1/expenses/branch/:branchId/dashboard
 * @desc    Get branch expense dashboard
 * @access  Private (All roles)
 */
router.get(
  '/branch/:branchId/dashboard',
  authorize(...viewRoles),
  validate(branchIdValidation),
  ExpenseController.getBranchDashboard
);

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Get expense by ID
 * @access  Private (All roles)
 */
router.get('/:id', authorize(...viewRoles), validate(idValidation), ExpenseController.getExpenseById);

/**
 * @route   POST /api/v1/expenses
 * @desc    Create a new expense
 * @access  Private (Branch Admin, Manager)
 */
router.post(
  '/',
  authorize(...branchRoles),
  validate(createExpenseValidator),
  ExpenseController.createExpense
);

/**
 * @route   PUT /api/v1/expenses/:id
 * @desc    Update expense
 * @access  Private (Branch Admin, Manager)
 */
router.put(
  '/:id',
  authorize(...branchRoles),
  validate([...idValidation, ...updateExpenseValidator]),
  ExpenseController.updateExpense
);

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Delete expense
 * @access  Private (Branch Admin, Manager)
 */
router.delete(
  '/:id',
  authorize(...branchRoles),
  validate(idValidation),
  ExpenseController.deleteExpense
);

/**
 * @route   POST /api/v1/expenses/:id/attachment
 * @desc    Upload expense attachment
 * @access  Private (Branch Admin, Manager)
 */
router.post(
  '/:id/attachment',
  authorize(...branchRoles),
  validate(idValidation),
  uploadExpenseAttachment,
  processExpenseAttachmentUpload(),
  ExpenseController.uploadAttachment
);

/**
 * @route   DELETE /api/v1/expenses/:id/attachment
 * @desc    Delete expense attachment
 * @access  Private (Branch Admin, Manager)
 */
router.delete(
  '/:id/attachment',
  authorize(...branchRoles),
  validate(idValidation),
  ExpenseController.deleteAttachment
);

export default router;
