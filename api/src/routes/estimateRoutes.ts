import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { EstimateController } from '../controllers/estimateController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createEstimateValidation,
  updateEstimateValidation,
  updateEstimateStatusValidation,
  sendEstimateValidation,
} from '../validators/estimateValidators';
import { param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const estimateIdValidation = [
  param('id').isUUID().withMessage('Invalid estimate ID format'),
];

/**
 * @route   POST /api/v1/estimates
 * @desc    Create a new estimate
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(createEstimateValidation),
  EstimateController.createEstimate
);

/**
 * @route   GET /api/v1/estimates
 * @desc    Get all estimates with filters
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
  EstimateController.getAllEstimates
);

/**
 * @route   GET /api/v1/estimates/:id
 * @desc    Get estimate by ID
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
  validate(estimateIdValidation),
  EstimateController.getEstimateById
);

/**
 * @route   PUT /api/v1/estimates/:id
 * @desc    Update estimate
 * @access  Private (Receptionist, Manager, Admin)
 */
router.put(
  '/:id',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...estimateIdValidation, ...updateEstimateValidation]),
  EstimateController.updateEstimate
);

/**
 * @route   DELETE /api/v1/estimates/:id
 * @desc    Delete estimate
 * @access  Private (Manager, Admin)
 */
router.delete(
  '/:id',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(estimateIdValidation),
  EstimateController.deleteEstimate
);

/**
 * @route   PUT /api/v1/estimates/:id/status
 * @desc    Update estimate status
 * @access  Private (Receptionist, Manager, Admin)
 */
router.put(
  '/:id/status',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...estimateIdValidation, ...updateEstimateStatusValidation]),
  EstimateController.updateEstimateStatus
);

/**
 * @route   POST /api/v1/estimates/:id/send
 * @desc    Send estimate to customer
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/:id/send',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...estimateIdValidation, ...sendEstimateValidation]),
  EstimateController.sendEstimate
);

/**
 * @route   POST /api/v1/estimates/:id/approve
 * @desc    Approve estimate
 * @access  Private (Manager, Admin)
 */
router.post(
  '/:id/approve',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(estimateIdValidation),
  EstimateController.approveEstimate
);

/**
 * @route   POST /api/v1/estimates/:id/reject
 * @desc    Reject estimate
 * @access  Private (Manager, Admin)
 */
router.post(
  '/:id/reject',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(estimateIdValidation),
  EstimateController.rejectEstimate
);

/**
 * @route   POST /api/v1/estimates/:id/convert
 * @desc    Convert estimate to invoice
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/:id/convert',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(estimateIdValidation),
  EstimateController.convertToInvoice
);

/**
 * @route   POST /api/v1/estimates/:id/regenerate-pdf
 * @desc    Regenerate estimate PDF
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/:id/regenerate-pdf',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(estimateIdValidation),
  EstimateController.regeneratePDF
);

/**
 * @route   GET /api/v1/estimates/:id/pdf
 * @desc    Stream estimate PDF on-demand (no file saved)
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
  validate(estimateIdValidation),
  EstimateController.getEstimatePDF
);

/**
 * @route   GET /api/v1/estimates/:id/download
 * @desc    Download estimate PDF on-demand (no file saved)
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id/download',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(estimateIdValidation),
  EstimateController.downloadEstimatePDF
);

/**
 * @route   POST /api/v1/estimates/:id/share
 * @desc    Get shareable estimate URL (for WhatsApp sharing)
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/:id/share',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(estimateIdValidation),
  EstimateController.getShareableEstimateURL
);

export default router;
