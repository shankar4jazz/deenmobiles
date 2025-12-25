import { body, ValidationChain } from 'express-validator';

/**
 * Validation rules for creating a supplier payment
 */
export const createSupplierPaymentValidation: ValidationChain[] = [
  body('purchaseOrderId')
    .trim()
    .notEmpty()
    .withMessage('Purchase order ID is required')
    .isUUID()
    .withMessage('Invalid purchase order ID format'),

  body('supplierId')
    .trim()
    .notEmpty()
    .withMessage('Supplier ID is required')
    .isUUID()
    .withMessage('Invalid supplier ID format'),

  body('amount')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),

  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Payment date must be a valid date'),

  body('paymentMethod')
    .trim()
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'])
    .withMessage('Invalid payment method'),

  body('referenceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference number must not exceed 100 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),

  body('branchId')
    .trim()
    .notEmpty()
    .withMessage('Branch ID is required')
    .isUUID()
    .withMessage('Invalid branch ID format'),
];

/**
 * Validation rules for updating a supplier payment
 * All fields are optional for updates
 */
export const updateSupplierPaymentValidation: ValidationChain[] = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),

  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Payment date must be a valid date'),

  body('paymentMethod')
    .optional()
    .trim()
    .isIn(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'])
    .withMessage('Invalid payment method'),

  body('referenceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference number must not exceed 100 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];
