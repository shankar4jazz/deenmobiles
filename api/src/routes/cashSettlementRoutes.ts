import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { CashSettlementController } from '../controllers/cashSettlementController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/cash-settlements
 * @desc    Create or get settlement for a date
 * @access  Private (Manager, Receptionist, Branch Admin)
 */
router.post(
  '/',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.BRANCH_ADMIN
  ),
  CashSettlementController.createSettlement
);

/**
 * @route   GET /api/v1/cash-settlements/today
 * @desc    Get today's settlement
 * @access  Private (Manager, Receptionist, Branch Admin)
 */
router.get(
  '/today',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.BRANCH_ADMIN
  ),
  CashSettlementController.getTodaySettlement
);

/**
 * @route   GET /api/v1/cash-settlements
 * @desc    Get settlements list (history)
 * @access  Private (Manager+)
 */
router.get(
  '/',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  CashSettlementController.getSettlements
);

/**
 * @route   GET /api/v1/cash-settlements/:id
 * @desc    Get settlement by ID
 * @access  Private (Manager+)
 */
router.get(
  '/:id',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST
  ),
  CashSettlementController.getSettlementById
);

/**
 * @route   PUT /api/v1/cash-settlements/:id/denominations
 * @desc    Update cash denominations
 * @access  Private (Manager, Receptionist)
 */
router.put(
  '/:id/denominations',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.BRANCH_ADMIN
  ),
  CashSettlementController.updateDenominations
);

/**
 * @route   PUT /api/v1/cash-settlements/:id/notes
 * @desc    Update settlement notes
 * @access  Private (Manager, Receptionist)
 */
router.put(
  '/:id/notes',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.BRANCH_ADMIN
  ),
  CashSettlementController.updateNotes
);

/**
 * @route   POST /api/v1/cash-settlements/:id/submit
 * @desc    Submit settlement for verification
 * @access  Private (Manager, Receptionist)
 */
router.post(
  '/:id/submit',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.BRANCH_ADMIN
  ),
  CashSettlementController.submitSettlement
);

/**
 * @route   POST /api/v1/cash-settlements/:id/verify
 * @desc    Verify settlement
 * @access  Private (Manager, Admin only)
 */
router.post(
  '/:id/verify',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  CashSettlementController.verifySettlement
);

/**
 * @route   POST /api/v1/cash-settlements/:id/reject
 * @desc    Reject settlement
 * @access  Private (Manager, Admin only)
 */
router.post(
  '/:id/reject',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  CashSettlementController.rejectSettlement
);

export default router;
