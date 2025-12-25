import { body } from 'express-validator';

export const createRequestValidator = [
  body('requestedAmount')
    .notEmpty()
    .withMessage('Requested amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Requested amount must be greater than 0'),

  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isString()
    .withMessage('Reason must be a string')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
];

export const updateRequestValidator = [
  body('requestedAmount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Requested amount must be greater than 0'),

  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
];

export const approveRequestValidator = [
  body('paymentMethodId')
    .optional()
    .isUUID()
    .withMessage('Invalid payment method ID format'),

  body('transactionRef')
    .optional()
    .isString()
    .withMessage('Transaction reference must be a string')
    .trim(),

  body('bankDetails')
    .optional()
    .isString()
    .withMessage('Bank details must be a string')
    .trim(),

  body('purpose')
    .optional()
    .isString()
    .withMessage('Purpose must be a string')
    .trim(),

  body('remarks')
    .optional()
    .isString()
    .withMessage('Remarks must be a string')
    .trim(),

  body('proofUrl')
    .optional()
    .isString()
    .withMessage('Proof URL must be a string')
    .trim(),
];

export const rejectRequestValidator = [
  body('rejectedReason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .withMessage('Rejection reason must be a string')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters'),
];
