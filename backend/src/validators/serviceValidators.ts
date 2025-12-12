import { body, ValidationChain } from 'express-validator';

/**
 * Validation rules for creating a service
 */
export const createServiceValidation: ValidationChain[] = [
  body('customerId')
    .trim()
    .notEmpty()
    .withMessage('Customer ID is required')
    .isUUID()
    .withMessage('Invalid customer ID format'),

  body('customerDeviceId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid customer device ID format'),

  body('faultIds')
    .isArray({ min: 1 })
    .withMessage('At least one fault is required'),

  body('faultIds.*')
    .isUUID()
    .withMessage('Invalid fault ID format'),

  body('deviceModel')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Device model must be between 2 and 100 characters'),

  body('deviceIMEI')
    .optional()
    .trim()
    .isLength({ min: 5, max: 17 })
    .withMessage('IMEI must be between 5 and 17 characters')
    .matches(/^[0-9]+$/)
    .withMessage('IMEI must contain only numbers'),

  body('devicePassword')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Device password must not exceed 50 characters'),

  body('devicePattern')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Device pattern must not exceed 50 characters'),

  body('conditionId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid condition ID format'),

  body('intakeNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Intake notes must not exceed 2000 characters'),

  body('accessoryIds')
    .optional()
    .isArray()
    .withMessage('Accessory IDs must be an array'),

  body('accessoryIds.*')
    .optional()
    .isUUID()
    .withMessage('Invalid accessory ID format'),

  body('issueIds')
    .optional()
    .isArray()
    .withMessage('Issue IDs must be an array'),

  body('issueIds.*')
    .optional()
    .isUUID()
    .withMessage('Invalid issue ID format'),

  body('issue')
    .trim()
    .notEmpty()
    .withMessage('Issue description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Issue description must be between 10 and 1000 characters'),

  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Diagnosis must not exceed 2000 characters'),

  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated cost must be a positive number'),

  body('actualCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual cost must be a positive number'),

  body('advancePayment')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Advance payment must be a positive number'),

  body('branchId')
    .trim()
    .notEmpty()
    .withMessage('Branch ID is required')
    .isUUID()
    .withMessage('Invalid branch ID format'),

  // Custom validation: either customerDeviceId or deviceModel must be provided
  body()
    .custom((value, { req }) => {
      const { customerDeviceId, deviceModel } = req.body;
      if (!customerDeviceId && !deviceModel) {
        throw new Error('Either customer device ID or device model must be provided');
      }
      return true;
    }),
];

/**
 * Validation rules for updating a service
 * All fields are optional except those that should not be blank if provided
 */
export const updateServiceValidation: ValidationChain[] = [
  body('deviceModel')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Device model must be between 2 and 100 characters'),

  body('deviceIMEI')
    .optional()
    .trim()
    .isLength({ min: 5, max: 17 })
    .withMessage('IMEI must be between 5 and 17 characters')
    .matches(/^[0-9]+$/)
    .withMessage('IMEI must contain only numbers'),

  body('devicePassword')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Device password must not exceed 50 characters'),

  body('issue')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Issue description must be between 10 and 1000 characters'),

  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Diagnosis must not exceed 2000 characters'),

  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated cost must be a positive number'),

  body('actualCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual cost must be a positive number'),

  body('advancePayment')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Advance payment must be a positive number'),
];

/**
 * Validation rules for updating service status
 */
export const updateStatusValidation: ValidationChain[] = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid service status'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

/**
 * Validation rules for assigning service to technician
 */
export const assignTechnicianValidation: ValidationChain[] = [
  body('assignedToId')
    .trim()
    .notEmpty()
    .withMessage('Technician ID is required')
    .isUUID()
    .withMessage('Invalid technician ID format'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

/**
 * Validation rules for updating diagnosis
 */
export const updateDiagnosisValidation: ValidationChain[] = [
  body('diagnosis')
    .trim()
    .notEmpty()
    .withMessage('Diagnosis is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Diagnosis must be between 10 and 2000 characters'),

  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated cost must be a positive number'),
];

/**
 * Validation rules for adding service part
 */
export const addServicePartValidation: ValidationChain[] = [
  body('branchInventoryId')
    .trim()
    .notEmpty()
    .withMessage('Branch inventory ID is required')
    .isUUID()
    .withMessage('Invalid branch inventory ID format'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  body('unitPrice')
    .notEmpty()
    .withMessage('Unit price is required')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
];

/**
 * Validation rules for service image caption
 */
export const addImageCaptionValidation: ValidationChain[] = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Caption must not exceed 200 characters'),
];

/**
 * Validation rules for service completion
 */
export const completeServiceValidation: ValidationChain[] = [
  body('actualCost')
    .notEmpty()
    .withMessage('Actual cost is required to complete service')
    .isFloat({ min: 0 })
    .withMessage('Actual cost must be a positive number'),

  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Diagnosis must not exceed 2000 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];
