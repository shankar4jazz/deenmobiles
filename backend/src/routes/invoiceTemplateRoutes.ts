import { Router } from 'express';
import { UserRole } from '@prisma/client';
import InvoiceTemplateController from '../controllers/invoiceTemplateController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createTemplateValidation,
  updateTemplateValidation,
  templateIdValidation,
} from '../validators/invoiceTemplateValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/invoice-templates
 * @desc    Create new invoice template
 * @access  Private (Manager, Admin)
 */
router.post(
  '/',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(createTemplateValidation),
  InvoiceTemplateController.createTemplate
);

/**
 * @route   GET /api/v1/invoice-templates
 * @desc    Get all invoice templates with filters
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
  InvoiceTemplateController.getAllTemplates
);

/**
 * @route   GET /api/v1/invoice-templates/:id
 * @desc    Get invoice template by ID
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
  validate(templateIdValidation),
  InvoiceTemplateController.getTemplateById
);

/**
 * @route   PUT /api/v1/invoice-templates/:id
 * @desc    Update invoice template
 * @access  Private (Manager, Admin)
 */
router.put(
  '/:id',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...templateIdValidation, ...updateTemplateValidation]),
  InvoiceTemplateController.updateTemplate
);

/**
 * @route   DELETE /api/v1/invoice-templates/:id
 * @desc    Delete invoice template
 * @access  Private (Manager, Admin)
 */
router.delete(
  '/:id',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(templateIdValidation),
  InvoiceTemplateController.deleteTemplate
);

/**
 * @route   PATCH /api/v1/invoice-templates/:id/toggle-status
 * @desc    Toggle template active status
 * @access  Private (Manager, Admin)
 */
router.patch(
  '/:id/toggle-status',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(templateIdValidation),
  InvoiceTemplateController.toggleTemplateStatus
);

export default router;
