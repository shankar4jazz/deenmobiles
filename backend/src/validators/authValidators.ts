import { body, ValidationChain } from 'express-validator';

/**
 * Validation rules for login
 */
export const loginValidation: ValidationChain[] = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Email or Username is required'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean value'),
];

/**
 * Validation rules for user registration
 */
export const registerValidation: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN', 'RECEPTIONIST'])
    .withMessage('Invalid role'),

  body('companyId')
    .trim()
    .notEmpty()
    .withMessage('Company ID is required')
    .isUUID()
    .withMessage('Invalid company ID format'),

  body('branchId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid branch ID format'),
];

/**
 * Validation rules for refresh token
 */
export const refreshTokenValidation: ValidationChain[] = [
  body('refreshToken')
    .trim()
    .notEmpty()
    .withMessage('Refresh token is required'),
];
