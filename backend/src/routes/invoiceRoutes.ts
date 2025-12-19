import { Router } from 'express';
import { UserRole } from '@prisma/client';
import InvoiceController from '../controllers/invoiceController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createInvoiceValidation,
  updateInvoiceValidation,
  recordPaymentValidation,
} from '../validators/invoiceValidators';
import { param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validations
const serviceIdValidation = [
  param('id').isUUID().withMessage('Invalid service ID format'),
];

const invoiceIdValidation = [
  param('id').isUUID().withMessage('Invalid invoice ID format'),
];

/**
 * @route   POST /api/v1/services/:id/invoice
 * @desc    Generate invoice from service
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/services/:id/invoice',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  InvoiceController.generateInvoiceFromService
);

/**
 * @route   POST /api/v1/invoices
 * @desc    Create standalone invoice
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
  validate(createInvoiceValidation),
  InvoiceController.createInvoice
);

/**
 * @route   GET /api/v1/invoices
 * @desc    Get all invoices with filters
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
  InvoiceController.getAllInvoices
);

/**
 * @route   GET /api/v1/invoices/:id
 * @desc    Get invoice by ID
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
  validate(invoiceIdValidation),
  InvoiceController.getInvoiceById
);

/**
 * @route   PUT /api/v1/invoices/:id
 * @desc    Update invoice
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
  validate([...invoiceIdValidation, ...updateInvoiceValidation]),
  InvoiceController.updateInvoice
);

/**
 * @route   DELETE /api/v1/invoices/:id
 * @desc    Delete invoice
 * @access  Private (Manager, Admin)
 */
router.delete(
  '/:id',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(invoiceIdValidation),
  InvoiceController.deleteInvoice
);

/**
 * @route   PUT /api/v1/invoices/:id/sync
 * @desc    Sync invoice from service - recalculates totals from current service data
 * @access  Private (Receptionist, Manager, Admin)
 */
router.put(
  '/:id/sync',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(invoiceIdValidation),
  InvoiceController.syncFromService
);

/**
 * @route   POST /api/v1/invoices/:id/payments
 * @desc    Record payment for invoice
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/:id/payments',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...invoiceIdValidation, ...recordPaymentValidation]),
  InvoiceController.recordPayment
);

/**
 * @route   GET /api/v1/invoices/:id/pdf
 * @desc    Download invoice PDF
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
  validate(invoiceIdValidation),
  InvoiceController.downloadInvoicePDF
);

/**
 * @route   POST /api/v1/invoices/:id/regenerate-pdf
 * @desc    Regenerate invoice PDF
 * @access  Private (Manager, Admin)
 */
router.post(
  '/:id/regenerate-pdf',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(invoiceIdValidation),
  InvoiceController.regenerateInvoicePDF
);

export default router;
