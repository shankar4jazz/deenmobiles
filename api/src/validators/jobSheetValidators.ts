import { body, param } from 'express-validator';

/**
 * Validation for generating job sheet
 */
export const generateJobSheetValidation = [
  param('serviceId')
    .isUUID()
    .withMessage('Invalid service ID format'),
];

/**
 * Validation for getting job sheet by ID
 */
export const jobSheetIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid job sheet ID format'),
];

/**
 * Validation for regenerating job sheet
 */
export const regenerateJobSheetValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid job sheet ID format'),
];
