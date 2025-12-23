import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { GSTR1Controller } from '../controllers/gstr1Controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/reports/gstr1
 * @desc    Get full GSTR1 report
 * @access  Private (Admin, Manager)
 */
router.get(
  '/',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  GSTR1Controller.getGSTR1Report
);

/**
 * @route   GET /api/v1/reports/gstr1/b2b
 * @desc    Get B2B invoices
 * @access  Private (Admin, Manager)
 */
router.get(
  '/b2b',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  GSTR1Controller.getB2BReport
);

/**
 * @route   GET /api/v1/reports/gstr1/b2c-large
 * @desc    Get B2C Large invoices
 * @access  Private (Admin, Manager)
 */
router.get(
  '/b2c-large',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  GSTR1Controller.getB2CLargeReport
);

/**
 * @route   GET /api/v1/reports/gstr1/b2c-small
 * @desc    Get B2C Small invoices
 * @access  Private (Admin, Manager)
 */
router.get(
  '/b2c-small',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  GSTR1Controller.getB2CSmallReport
);

/**
 * @route   GET /api/v1/reports/gstr1/hsn-summary
 * @desc    Get HSN Summary
 * @access  Private (Admin, Manager)
 */
router.get(
  '/hsn-summary',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  GSTR1Controller.getHSNSummaryReport
);

/**
 * @route   GET /api/v1/reports/gstr1/document-summary
 * @desc    Get Document Summary
 * @access  Private (Admin, Manager)
 */
router.get(
  '/document-summary',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  GSTR1Controller.getDocumentSummaryReport
);

/**
 * @route   GET /api/v1/reports/gstr1/export
 * @desc    Export GSTR1 report to Excel
 * @access  Private (Admin, Manager)
 */
router.get(
  '/export',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  GSTR1Controller.exportGSTR1
);

export default router;
