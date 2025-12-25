import { body, ValidationChain } from 'express-validator';

/**
 * Validation rules for creating a purchase order
 */
export const createPurchaseOrderValidation: ValidationChain[] = [
  body('supplierId')
    .trim()
    .notEmpty()
    .withMessage('Supplier ID is required')
    .isUUID()
    .withMessage('Invalid supplier ID format'),

  body('branchId')
    .trim()
    .notEmpty()
    .withMessage('Branch ID is required')
    .isUUID()
    .withMessage('Invalid branch ID format'),

  body('orderDate')
    .optional()
    .isISO8601()
    .withMessage('Order date must be a valid date'),

  body('expectedDelivery')
    .optional()
    .isISO8601()
    .withMessage('Expected delivery date must be a valid date'),

  body('invoiceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Invoice number must not exceed 100 characters'),

  body('invoiceDate')
    .optional()
    .isISO8601()
    .withMessage('Invoice date must be a valid date'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),

  body('items.*.itemId')
    .trim()
    .notEmpty()
    .withMessage('Item ID is required for each item')
    .isUUID()
    .withMessage('Invalid item ID format'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required for each item')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),

  body('items.*.unitPrice')
    .notEmpty()
    .withMessage('Unit price is required for each item')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),

  body('items.*.taxRate')
    .notEmpty()
    .withMessage('Tax rate is required for each item')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
];

/**
 * Validation rules for updating a purchase order
 * All fields are optional for updates
 */
export const updatePurchaseOrderValidation: ValidationChain[] = [
  body('supplierId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid supplier ID format'),

  body('orderDate')
    .optional()
    .isISO8601()
    .withMessage('Order date must be a valid date'),

  body('expectedDelivery')
    .optional()
    .isISO8601()
    .withMessage('Expected delivery date must be a valid date'),

  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date'),

  body('invoiceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Invoice number must not exceed 100 characters'),

  body('invoiceDate')
    .optional()
    .isISO8601()
    .withMessage('Invoice date must be a valid date'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),

  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one item is required if items are provided'),

  body('items.*.itemId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid item ID format'),

  body('items.*.inventoryId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid inventory ID format'),

  body('items.*.quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),

  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),

  body('items.*.taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
];

/**
 * Validation rules for receiving items
 */
export const receiveItemsValidation: ValidationChain[] = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),

  body('items.*.itemId')
    .trim()
    .notEmpty()
    .withMessage('Item ID is required for each item')
    .isUUID()
    .withMessage('Invalid item ID format'),

  body('items.*.receivedQty')
    .notEmpty()
    .withMessage('Received quantity is required for each item')
    .isFloat({ min: 0.01 })
    .withMessage('Received quantity must be greater than 0'),

  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

/**
 * Validation rules for updating purchase order status
 */
export const updateStatusValidation: ValidationChain[] = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn([
      'DRAFT',
      'PENDING',
      'PARTIALLY_RECEIVED',
      'RECEIVED',
      'COMPLETED',
      'CANCELLED',
    ])
    .withMessage('Invalid status'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];
