import { body, ValidationChain } from 'express-validator';

/**
 * Validation helper for HSN Code format
 * HSN code should be 6 or 8 digits
 */
const hsnCodeRegex = /^[0-9]{6,8}$/;

/**
 * Validation rules for creating inventory
 */
export const createInventoryValidation: ValidationChain[] = [
  body('partNumber')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Part number must be between 2 and 50 characters'),

  body('partName')
    .trim()
    .notEmpty()
    .withMessage('Part name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Part name must be between 2 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('modelVariant')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Model/Variant must not exceed 100 characters'),

  body('brandName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Brand name must not exceed 100 characters'),

  body('category')
    .optional()
    .trim()
    .isIn([
      'ELECTRICAL',
      'MECHANICAL',
      'DISPLAY',
      'BATTERY',
      'ACCESSORY',
      'CHARGER',
      'CABLE',
      'CASE_COVER',
      'SCREEN_PROTECTOR',
      'AUDIO',
      'CAMERA',
      'OTHER',
    ])
    .withMessage('Invalid category'),

  body('unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required')
    .isIn(['PIECE', 'METER', 'LITRE', 'KILOGRAM', 'BOX', 'SET', 'PAIR', 'ROLL', 'PACKET'])
    .withMessage('Invalid unit'),

  body('purchasePrice')
    .notEmpty()
    .withMessage('Purchase price is required')
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),

  body('salesPrice')
    .notEmpty()
    .withMessage('Sales price is required')
    .isFloat({ min: 0 })
    .withMessage('Sales price must be a positive number'),

  body('hsnCode')
    .trim()
    .notEmpty()
    .withMessage('HSN code is required for GST compliance')
    .matches(hsnCodeRegex)
    .withMessage('HSN code must be 6 or 8 digits'),

  body('gstRate')
    .trim()
    .notEmpty()
    .withMessage('GST rate is required for GST compliance')
    .isIn(['ZERO', 'FIVE', 'TWELVE', 'EIGHTEEN', 'TWENTY_EIGHT'])
    .withMessage('Invalid GST rate'),

  body('taxType')
    .trim()
    .notEmpty()
    .withMessage('Tax type is required for GST compliance')
    .isIn(['IGST', 'CGST_SGST'])
    .withMessage('Tax type must be either IGST or CGST_SGST'),

  body('stockQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Stock quantity must be a positive number'),

  body('minStockLevel')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum stock level must be a positive number'),

  body('maxStockLevel')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum stock level must be a positive number'),

  body('reorderLevel')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Reorder level must be a positive number'),

  body('supplierId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid supplier ID format'),

  body('supplierInvoiceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Supplier invoice number must not exceed 100 characters'),

  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Purchase date must be a valid date'),

  body('branchId')
    .trim()
    .notEmpty()
    .withMessage('Branch ID is required')
    .isUUID()
    .withMessage('Invalid branch ID format'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value'),
];

/**
 * Validation rules for updating inventory
 * All fields are optional for updates except those required for GST compliance
 */
export const updateInventoryValidation: ValidationChain[] = [
  body('partNumber')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Part number must be between 2 and 50 characters'),

  body('partName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Part name must be between 2 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('modelVariant')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Model/Variant must not exceed 100 characters'),

  body('brandName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Brand name must not exceed 100 characters'),

  body('category')
    .optional()
    .trim()
    .isIn([
      'ELECTRICAL',
      'MECHANICAL',
      'DISPLAY',
      'BATTERY',
      'ACCESSORY',
      'CHARGER',
      'CABLE',
      'CASE_COVER',
      'SCREEN_PROTECTOR',
      'AUDIO',
      'CAMERA',
      'OTHER',
    ])
    .withMessage('Invalid category'),

  body('unit')
    .optional()
    .trim()
    .isIn(['PIECE', 'METER', 'LITRE', 'KILOGRAM', 'BOX', 'SET', 'PAIR', 'ROLL', 'PACKET'])
    .withMessage('Invalid unit'),

  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),

  body('salesPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Sales price must be a positive number'),

  body('hsnCode')
    .optional()
    .trim()
    .matches(hsnCodeRegex)
    .withMessage('HSN code must be 6 or 8 digits'),

  body('gstRate')
    .optional()
    .trim()
    .isIn(['ZERO', 'FIVE', 'TWELVE', 'EIGHTEEN', 'TWENTY_EIGHT'])
    .withMessage('Invalid GST rate'),

  body('taxType')
    .optional()
    .trim()
    .isIn(['IGST', 'CGST_SGST'])
    .withMessage('Tax type must be either IGST or CGST_SGST'),

  body('stockQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Stock quantity must be a positive number'),

  body('minStockLevel')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum stock level must be a positive number'),

  body('maxStockLevel')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum stock level must be a positive number'),

  body('reorderLevel')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Reorder level must be a positive number'),

  body('supplierId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid supplier ID format'),

  body('supplierInvoiceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Supplier invoice number must not exceed 100 characters'),

  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Purchase date must be a valid date'),

  body('branchId')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid branch ID format'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value'),
];

/**
 * Validation rules for stock adjustment
 */
export const stockAdjustmentValidation: ValidationChain[] = [
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat()
    .withMessage('Quantity must be a number'),

  body('movementType')
    .trim()
    .notEmpty()
    .withMessage('Movement type is required')
    .isIn([
      'PURCHASE',
      'SALE',
      'ADJUSTMENT',
      'TRANSFER',
      'SERVICE_USE',
      'RETURN',
      'DAMAGE',
      'OPENING_STOCK',
    ])
    .withMessage('Invalid movement type'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),

  body('referenceType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Reference type must not exceed 50 characters'),

  body('referenceId')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Reference ID must not exceed 50 characters'),
];
