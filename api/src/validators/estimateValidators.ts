import { body, ValidationChain } from 'express-validator';
import { EstimateStatus } from '@prisma/client';

/**
 * Validation rules for creating an estimate
 */
export const createEstimateValidation: ValidationChain[] = [
  body('customerId')
    .trim()
    .notEmpty()
    .withMessage('Customer ID is required')
    .isUUID()
    .withMessage('Invalid customer ID format'),

  body('serviceId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid service ID format'),

  body('branchId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid branch ID format'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),

  body('items.*.description')
    .trim()
    .notEmpty()
    .withMessage('Item description is required')
    .isLength({ min: 2, max: 500 })
    .withMessage('Item description must be between 2 and 500 characters'),

  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Item quantity must be greater than 0'),

  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Item unit price must be a positive number'),

  body('items.*.amount')
    .isFloat({ min: 0 })
    .withMessage('Item amount must be a positive number'),

  body('subtotal')
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),

  body('taxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax amount must be a positive number'),

  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
];

/**
 * Validation rules for updating an estimate
 */
export const updateEstimateValidation: ValidationChain[] = [
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),

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

  body('subtotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),

  body('taxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax amount must be a positive number'),

  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
];

/**
 * Validation rules for updating estimate status
 */
export const updateEstimateStatusValidation: ValidationChain[] = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(EstimateStatus))
    .withMessage('Invalid estimate status'),
];

/**
 * Validation rules for sending an estimate
 */
export const sendEstimateValidation: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
];
