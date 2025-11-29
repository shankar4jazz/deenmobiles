import { Router } from 'express';
import { UserRole } from '@prisma/client';
import JobSheetController from '../controllers/jobSheetController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validations
const serviceIdValidation = [
  param('id').isUUID().withMessage('Invalid service ID format'),
];

const jobSheetIdValidation = [
  param('id').isUUID().withMessage('Invalid job sheet ID format'),
];

/**
 * @route   POST /api/v1/services/:id/jobsheet
 * @desc    Generate job sheet for a service
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/services/:id/jobsheet',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  JobSheetController.generateJobSheet
);

/**
 * @route   GET /api/v1/services/:id/jobsheet
 * @desc    Get job sheet for a service
 * @access  Private (All authenticated users)
 */
router.get(
  '/services/:id/jobsheet',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(serviceIdValidation),
  JobSheetController.getJobSheetByServiceId
);

/**
 * @route   GET /api/v1/jobsheets
 * @desc    Get all job sheets with filters
 * @access  Private (All authenticated users with role-based filtering)
 */
router.get(
  '/',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  JobSheetController.getAllJobSheets
);

/**
 * @route   GET /api/v1/jobsheets/:id
 * @desc    Get job sheet by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(jobSheetIdValidation),
  JobSheetController.getJobSheetById
);

/**
 * @route   POST /api/v1/jobsheets/:id/regenerate
 * @desc    Regenerate job sheet PDF
 * @access  Private (Manager, Admin)
 */
router.post(
  '/:id/regenerate',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(jobSheetIdValidation),
  JobSheetController.regenerateJobSheet
);

/**
 * @route   GET /api/v1/jobsheets/:id/pdf
 * @desc    Download job sheet PDF
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id/pdf',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(jobSheetIdValidation),
  JobSheetController.downloadJobSheetPDF
);

export default router;
