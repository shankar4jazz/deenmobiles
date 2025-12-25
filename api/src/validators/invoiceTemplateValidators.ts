import { body, param } from 'express-validator';

/**
 * Validation for creating invoice template
 */
export const createTemplateValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Template name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Template name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
  body('branchId')
    .optional()
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
  body('items.*.sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a positive integer'),
];

/**
 * Validation for updating invoice template
 */
export const updateTemplateValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Template name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Template name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items array must contain at least one item'),
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
  body('items.*.sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a positive integer'),
];

/**
 * Validation for template ID parameter
 */
export const templateIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid template ID format'),
];
