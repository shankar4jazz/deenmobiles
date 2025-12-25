import { body, param, ValidationChain } from 'express-validator';
import { UserRole } from '@prisma/client';

/**
 * Validation rules for creating an employee
 */
export const createEmployeeValidation: ValidationChain[] = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(Object.values(UserRole))
    .withMessage('Invalid role'),

  body('roleId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid role ID format'),

  body('customRoleId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid custom role ID format'),

  body('branchId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid branch ID format'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
];

/**
 * Validation rules for updating an employee
 */
export const updateEmployeeValidation: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Employee ID is required')
    .isUUID()
    .withMessage('Invalid employee ID format'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),

  body('password')
    .optional()
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('phone')
    .optional()
    .custom((value) => {
      if (value === null || value === '') return true; // Allow null/empty to clear phone
      return true;
    })
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('Invalid role'),

  body('roleId')
    .optional()
    .custom((value) => {
      if (value === null) return true; // Allow null to clear role
      return true;
    })
    .isUUID()
    .withMessage('Invalid role ID format'),

  body('customRoleId')
    .optional()
    .custom((value) => {
      if (value === null) return true; // Allow null to clear custom role
      return true;
    })
    .isUUID()
    .withMessage('Invalid custom role ID format'),

  body('branchId')
    .optional()
    .custom((value) => {
      if (value === null) return true; // Allow null to unassign from branch
      return true;
    })
    .isUUID()
    .withMessage('Invalid branch ID format'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
];

/**
 * Validation rules for employee ID parameter
 */
export const employeeIdValidation: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Employee ID is required')
    .isUUID()
    .withMessage('Invalid employee ID format'),
];
