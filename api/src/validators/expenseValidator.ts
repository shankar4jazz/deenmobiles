import { body } from 'express-validator';

export const createExpenseValidator = [
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isUUID()
    .withMessage('Invalid category ID format'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  body('expenseDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expense date format'),

  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Description must be between 5 and 1000 characters'),

  body('billNumber')
    .optional()
    .isString()
    .withMessage('Bill number must be a string')
    .trim(),

  body('vendorName')
    .optional()
    .isString()
    .withMessage('Vendor name must be a string')
    .trim(),

  body('attachmentUrl')
    .optional()
    .isString()
    .withMessage('Attachment URL must be a string')
    .trim(),

  body('remarks')
    .optional()
    .isString()
    .withMessage('Remarks must be a string')
    .trim(),
];

export const updateExpenseValidator = [
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID format'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  body('expenseDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expense date format'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Description must be between 5 and 1000 characters'),

  body('billNumber')
    .optional()
    .isString()
    .withMessage('Bill number must be a string')
    .trim(),

  body('vendorName')
    .optional()
    .isString()
    .withMessage('Vendor name must be a string')
    .trim(),

  body('attachmentUrl')
    .optional()
    .isString()
    .withMessage('Attachment URL must be a string')
    .trim(),

  body('remarks')
    .optional()
    .isString()
    .withMessage('Remarks must be a string')
    .trim(),
];
