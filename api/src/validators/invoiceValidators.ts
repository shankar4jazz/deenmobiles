import { body, param } from 'express-validator';

/**
 * Validation for creating invoice (supports both service-linked and standalone)
 */
export const createInvoiceValidation = [
  body('serviceId')
    .optional()
    .isUUID()
    .withMessage('Invalid service ID format'),
  body('customerId')
    .optional()
    .isUUID()
    .withMessage('Invalid customer ID format'),
  body('branchId')
    .optional()
    .isUUID()
    .withMessage('Invalid branch ID format'),
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one item is required for standalone invoices'),
  body('items.*.description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Item description is required')
    .isLength({ min: 2, max: 500 })
    .withMessage('Item description must be between 2 and 500 characters'),
  body('items.*.quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Item quantity must be greater than 0'),
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Item unit price must be a positive number'),
  body('items.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Item amount must be a positive number'),
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('paidAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Paid amount must be a positive number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  // Custom validation: either serviceId or (customerId AND branchId) must be provided
  body()
    .custom((value, { req }) => {
      const { serviceId, customerId, branchId } = req.body;
      if (!serviceId && (!customerId || !branchId)) {
        throw new Error('Either serviceId or both customerId and branchId must be provided');
      }
      return true;
    }),
];

/**
 * Validation for updating invoice
 */
export const updateInvoiceValidation = [
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('paidAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Paid amount must be a positive number'),
];

/**
 * Validation for recording payment
 */
export const recordPaymentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than zero'),
  body('paymentMethodId')
    .isUUID()
    .withMessage('Invalid payment method ID format'),
  body('transactionId')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID must be a string with max 100 characters'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be a string with max 500 characters'),
];

/**
 * Validation for invoice ID parameter
 */
export const invoiceIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid invoice ID format'),
];
