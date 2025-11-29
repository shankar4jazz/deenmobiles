import { body } from 'express-validator';
import { PettyCashTransferStatus } from '@prisma/client';

export const createTransferValidator = [
  body('branchId')
    .notEmpty()
    .withMessage('Branch ID is required')
    .isUUID()
    .withMessage('Invalid branch ID format'),

  body('employeeId')
    .optional()
    .isUUID()
    .withMessage('Invalid employee ID format'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  body('transferDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid transfer date format'),

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

export const updateTransferValidator = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  body('transferDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid transfer date format'),

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

  body('status')
    .optional()
    .isIn(Object.values(PettyCashTransferStatus))
    .withMessage('Invalid transfer status'),
];
