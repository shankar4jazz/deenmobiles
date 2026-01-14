import { body, ValidationChain } from 'express-validator';

/**
 * Validation helper for Indian GST Number format
 * Format: 22AAAAA0000A1Z5 (15 characters)
 * 2 digits (State Code) + 10 chars (PAN) + 1 digit (Entity Number) + 1 char (Z) + 1 check digit
 */
const gstNumberRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Validation helper for Indian PAN Number format
 * Format: AAAAA0000A (10 characters)
 * 5 letters + 4 digits + 1 letter
 */
const panNumberRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/**
 * Validation helper for IFSC Code format
 * Format: AAAA0XXXXXX (11 characters)
 * 4 letters (Bank code) + 0 + 6 alphanumeric (Branch code)
 */
const ifscCodeRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Validation rules for creating a supplier
 */
export const createSupplierValidation: ValidationChain[] = [
  body('supplierCode')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Supplier code must be between 2 and 50 characters'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Supplier name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Supplier name must be between 2 and 200 characters'),

  body('contactPerson')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact person name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),

  body('alternatePhone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit alternate phone number'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City name must not exceed 100 characters'),

  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State name must not exceed 100 characters'),

  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country name must not exceed 100 characters'),

  body('pincode')
    .optional()
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('Please provide a valid 6-digit pincode'),

  body('gstNumber')
    .optional()
    .trim()
    .matches(gstNumberRegex)
    .withMessage('Please provide a valid GST number (format: 22AAAAA0000A1Z5)'),

  body('panNumber')
    .optional()
    .trim()
    .matches(panNumberRegex)
    .withMessage('Please provide a valid PAN number (format: AAAAA0000A)'),

  body('bankName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bank name must not exceed 100 characters'),

  body('accountNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{9,18}$/)
    .withMessage('Please provide a valid account number (9-18 digits)'),

  body('ifscCode')
    .optional()
    .trim()
    .matches(ifscCodeRegex)
    .withMessage('Please provide a valid IFSC code (format: AAAA0XXXXXX)'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value'),
];

/**
 * Validation rules for updating a supplier
 * All fields are optional for updates
 */
export const updateSupplierValidation: ValidationChain[] = [
  body('supplierCode')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Supplier code must be between 2 and 50 characters'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Supplier name must be between 2 and 200 characters'),

  body('contactPerson')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact person name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),

  body('alternatePhone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit alternate phone number'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City name must not exceed 100 characters'),

  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State name must not exceed 100 characters'),

  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country name must not exceed 100 characters'),

  body('pincode')
    .optional()
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('Please provide a valid 6-digit pincode'),

  body('gstNumber')
    .optional()
    .trim()
    .matches(gstNumberRegex)
    .withMessage('Please provide a valid GST number (format: 22AAAAA0000A1Z5)'),

  body('panNumber')
    .optional()
    .trim()
    .matches(panNumberRegex)
    .withMessage('Please provide a valid PAN number (format: AAAAA0000A)'),

  body('bankName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bank name must not exceed 100 characters'),

  body('accountNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{9,18}$/)
    .withMessage('Please provide a valid account number (9-18 digits)'),

  body('ifscCode')
    .optional()
    .trim()
    .matches(ifscCodeRegex)
    .withMessage('Please provide a valid IFSC code (format: AAAA0XXXXXX)'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value'),
];
