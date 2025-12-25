import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ReportController } from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/reports/booking-person
 * @desc    Get booking person wise report
 * @access  Private (Manager+, Receptionist)
 */
router.get(
  '/booking-person',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST
  ),
  ReportController.getBookingPersonReport
);

/**
 * @route   GET /api/v1/reports/technician
 * @desc    Get technician wise report
 * @access  Private (Manager+)
 */
router.get(
  '/technician',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  ReportController.getTechnicianReport
);

/**
 * @route   GET /api/v1/reports/brand
 * @desc    Get brand wise report
 * @access  Private (Manager+)
 */
router.get(
  '/brand',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  ReportController.getBrandReport
);

/**
 * @route   GET /api/v1/reports/fault
 * @desc    Get fault wise report
 * @access  Private (Manager+)
 */
router.get(
  '/fault',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  ReportController.getFaultReport
);

/**
 * @route   GET /api/v1/reports/daily-transaction
 * @desc    Get daily transaction report
 * @access  Private (Manager+, Receptionist)
 */
router.get(
  '/daily-transaction',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST
  ),
  ReportController.getDailyTransactionReport
);

/**
 * @route   GET /api/v1/reports/cash-settlement
 * @desc    Get daily cash settlement report
 * @access  Private (Manager+, Receptionist)
 */
router.get(
  '/cash-settlement',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST
  ),
  ReportController.getDailyCashSettlement
);

/**
 * @route   POST /api/v1/reports/opening-balance
 * @desc    Set opening balance for a payment method
 * @access  Private (Manager+)
 */
router.post(
  '/opening-balance',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  ReportController.setOpeningBalance
);

/**
 * @route   POST /api/v1/reports/closing-balance
 * @desc    Set closing balance and carry forward
 * @access  Private (Manager+)
 */
router.post(
  '/closing-balance',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  ReportController.setClosingBalance
);

/**
 * @route   POST /api/v1/reports/export
 * @desc    Export report to PDF or Excel
 * @access  Private (Manager+)
 */
router.post(
  '/export',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  ReportController.exportReport
);

export default router;
