import { body, param, ValidationChain } from 'express-validator';

/**
 * Validation rules for creating a role
 */
export const createRoleValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('permissionIds')
    .optional()
    .isArray()
    .withMessage('Permission IDs must be an array'),

  body('permissionIds.*')
    .optional()
    .isUUID()
    .withMessage('Each permission ID must be a valid UUID'),
];

/**
 * Validation rules for updating a role
 */
export const updateRoleValidation: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Role ID is required')
    .isUUID()
    .withMessage('Invalid role ID format'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

/**
 * Validation rules for role ID parameter
 */
export const roleIdValidation: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Role ID is required')
    .isUUID()
    .withMessage('Invalid role ID format'),
];

/**
 * Validation rules for assigning permissions
 */
export const assignPermissionsValidation: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Role ID is required')
    .isUUID()
    .withMessage('Invalid role ID format'),

  body('permissionIds')
    .notEmpty()
    .withMessage('Permission IDs are required')
    .isArray({ min: 1 })
    .withMessage('Permission IDs must be a non-empty array'),

  body('permissionIds.*')
    .isUUID()
    .withMessage('Each permission ID must be a valid UUID'),
];

/**
 * Validation rules for removing permissions
 */
export const removePermissionsValidation: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Role ID is required')
    .isUUID()
    .withMessage('Invalid role ID format'),

  body('permissionIds')
    .notEmpty()
    .withMessage('Permission IDs are required')
    .isArray({ min: 1 })
    .withMessage('Permission IDs must be a non-empty array'),

  body('permissionIds.*')
    .isUUID()
    .withMessage('Each permission ID must be a valid UUID'),
];
