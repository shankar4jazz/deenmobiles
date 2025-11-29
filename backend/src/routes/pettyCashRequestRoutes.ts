import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { PettyCashRequestController } from '../controllers/pettyCashRequestController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { param } from 'express-validator';
import {
  createRequestValidator,
  updateRequestValidator,
  approveRequestValidator,
  rejectRequestValidator,
} from '../validators/pettyCashRequestValidator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const idValidation = [param('id').isUUID().withMessage('Invalid ID format')];

// Authorize for Admin roles (Super Admin and Admin can approve/reject)
const adminRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

// Authorize for branch users (can create and manage own requests)
const branchRoles = [UserRole.BRANCH_ADMIN, UserRole.MANAGER];

// Authorize for viewing (Admin, Branch Admin, Manager can view)
const viewRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.MANAGER,
];

// ==================== PETTY CASH REQUEST ROUTES ====================

/**
 * @route   GET /api/v1/petty-cash-requests
 * @desc    Get all petty cash requests with filters
 * @access  Private (Super Admin, Admin, Branch Admin, Manager)
 */
router.get('/', authorize(...viewRoles), PettyCashRequestController.getAllRequests);

/**
 * @route   GET /api/v1/petty-cash-requests/stats
 * @desc    Get request statistics
 * @access  Private (Super Admin, Admin)
 */
router.get('/stats', authorize(...adminRoles), PettyCashRequestController.getRequestStats);

/**
 * @route   GET /api/v1/petty-cash-requests/my-requests
 * @desc    Get current user's branch petty cash requests
 * @access  Private (Branch Admin, Manager)
 */
router.get('/my-requests', authorize(...branchRoles), PettyCashRequestController.getMyRequests);

/**
 * @route   GET /api/v1/petty-cash-requests/:id
 * @desc    Get petty cash request by ID
 * @access  Private (Super Admin, Admin, Branch Admin, Manager)
 */
router.get(
  '/:id',
  authorize(...viewRoles),
  validate(idValidation),
  PettyCashRequestController.getRequestById
);

/**
 * @route   POST /api/v1/petty-cash-requests
 * @desc    Create a new petty cash request
 * @access  Private (Branch Admin, Manager)
 */
router.post(
  '/',
  authorize(...branchRoles),
  validate(createRequestValidator),
  PettyCashRequestController.createRequest
);

/**
 * @route   PUT /api/v1/petty-cash-requests/:id
 * @desc    Update petty cash request (only pending requests by requester)
 * @access  Private (Branch Admin, Manager - own requests only)
 */
router.put(
  '/:id',
  authorize(...branchRoles),
  validate([...idValidation, ...updateRequestValidator]),
  PettyCashRequestController.updateRequest
);

/**
 * @route   POST /api/v1/petty-cash-requests/:id/approve
 * @desc    Approve petty cash request and create transfer
 * @access  Private (Super Admin, Admin)
 */
router.post(
  '/:id/approve',
  authorize(...adminRoles),
  validate([...idValidation, ...approveRequestValidator]),
  PettyCashRequestController.approveRequest
);

/**
 * @route   POST /api/v1/petty-cash-requests/:id/reject
 * @desc    Reject petty cash request
 * @access  Private (Super Admin, Admin)
 */
router.post(
  '/:id/reject',
  authorize(...adminRoles),
  validate([...idValidation, ...rejectRequestValidator]),
  PettyCashRequestController.rejectRequest
);

/**
 * @route   DELETE /api/v1/petty-cash-requests/:id
 * @desc    Cancel petty cash request (by requester)
 * @access  Private (Branch Admin, Manager - own requests only)
 */
router.delete(
  '/:id',
  authorize(...branchRoles),
  validate(idValidation),
  PettyCashRequestController.cancelRequest
);

export default router;
