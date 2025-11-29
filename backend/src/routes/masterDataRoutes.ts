import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { MasterDataController } from '../controllers/masterDataController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const idValidation = [param('id').isUUID().withMessage('Invalid ID format')];

// Authorize for Admin, Branch Admin, and Manager roles
const authorizedRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.MANAGER,
];

// ==================== ITEM CATEGORY ROUTES ====================

/**
 * @route   GET /api/v1/master-data/categories
 * @desc    Get all item categories
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get('/categories', authorize(...authorizedRoles), MasterDataController.getAllCategories);

/**
 * @route   GET /api/v1/master-data/categories/:id
 * @desc    Get category by ID
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/categories/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.getCategoryById
);

/**
 * @route   POST /api/v1/master-data/categories
 * @desc    Create a new item category
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post('/categories', authorize(...authorizedRoles), MasterDataController.createCategory);

/**
 * @route   PUT /api/v1/master-data/categories/:id
 * @desc    Update item category
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.put(
  '/categories/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.updateCategory
);

/**
 * @route   DELETE /api/v1/master-data/categories/:id
 * @desc    Deactivate category (soft delete)
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.delete(
  '/categories/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.deactivateCategory
);

// ==================== ITEM UNIT ROUTES ====================

/**
 * @route   GET /api/v1/master-data/units
 * @desc    Get all item units
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get('/units', authorize(...authorizedRoles), MasterDataController.getAllUnits);

/**
 * @route   GET /api/v1/master-data/units/:id
 * @desc    Get unit by ID
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/units/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.getUnitById
);

/**
 * @route   POST /api/v1/master-data/units
 * @desc    Create a new item unit
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post('/units', authorize(...authorizedRoles), MasterDataController.createUnit);

/**
 * @route   PUT /api/v1/master-data/units/:id
 * @desc    Update item unit
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.put(
  '/units/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.updateUnit
);

/**
 * @route   DELETE /api/v1/master-data/units/:id
 * @desc    Deactivate unit (soft delete)
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.delete(
  '/units/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.deactivateUnit
);

// ==================== ITEM GST RATE ROUTES ====================

/**
 * @route   GET /api/v1/master-data/gst-rates
 * @desc    Get all GST rates
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get('/gst-rates', authorize(...authorizedRoles), MasterDataController.getAllGSTRates);

/**
 * @route   GET /api/v1/master-data/gst-rates/:id
 * @desc    Get GST rate by ID
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/gst-rates/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.getGSTRateById
);

/**
 * @route   POST /api/v1/master-data/gst-rates
 * @desc    Create a new GST rate
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post('/gst-rates', authorize(...authorizedRoles), MasterDataController.createGSTRate);

/**
 * @route   PUT /api/v1/master-data/gst-rates/:id
 * @desc    Update GST rate
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.put(
  '/gst-rates/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.updateGSTRate
);

/**
 * @route   DELETE /api/v1/master-data/gst-rates/:id
 * @desc    Deactivate GST rate (soft delete)
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.delete(
  '/gst-rates/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.deactivateGSTRate
);

// ==================== ITEM BRAND ROUTES ====================

/**
 * @route   GET /api/v1/master-data/brands
 * @desc    Get all item brands
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get('/brands', authorize(...authorizedRoles), MasterDataController.getAllBrands);

/**
 * @route   GET /api/v1/master-data/brands/:id
 * @desc    Get brand by ID
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/brands/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.getBrandById
);

/**
 * @route   POST /api/v1/master-data/brands
 * @desc    Create a new item brand
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post('/brands', authorize(...authorizedRoles), MasterDataController.createBrand);

/**
 * @route   PUT /api/v1/master-data/brands/:id
 * @desc    Update item brand
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.put(
  '/brands/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.updateBrand
);

/**
 * @route   DELETE /api/v1/master-data/brands/:id
 * @desc    Deactivate brand (soft delete)
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.delete(
  '/brands/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.deactivateBrand
);

// ==================== ITEM MODEL ROUTES ====================

/**
 * @route   GET /api/v1/master-data/models
 * @desc    Get all item models
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get('/models', authorize(...authorizedRoles), MasterDataController.getAllModels);

/**
 * @route   GET /api/v1/master-data/models/:id
 * @desc    Get model by ID
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/models/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.getModelById
);

/**
 * @route   POST /api/v1/master-data/models
 * @desc    Create a new item model
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post('/models', authorize(...authorizedRoles), MasterDataController.createModel);

/**
 * @route   PUT /api/v1/master-data/models/:id
 * @desc    Update item model
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.put(
  '/models/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.updateModel
);

/**
 * @route   DELETE /api/v1/master-data/models/:id
 * @desc    Deactivate model (soft delete)
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.delete(
  '/models/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.deactivateModel
);

// ==================== SERVICE CATEGORY ROUTES ====================

/**
 * @route   GET /api/v1/master-data/service-categories
 * @desc    Get all service categories
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get('/service-categories', authorize(...authorizedRoles), MasterDataController.getAllServiceCategories);

/**
 * @route   GET /api/v1/master-data/service-categories/:id
 * @desc    Get service category by ID
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/service-categories/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.getServiceCategoryById
);

/**
 * @route   POST /api/v1/master-data/service-categories
 * @desc    Create a new service category
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post('/service-categories', authorize(...authorizedRoles), MasterDataController.createServiceCategory);

/**
 * @route   PUT /api/v1/master-data/service-categories/:id
 * @desc    Update service category
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.put(
  '/service-categories/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.updateServiceCategory
);

/**
 * @route   DELETE /api/v1/master-data/service-categories/:id
 * @desc    Deactivate service category (soft delete)
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.delete(
  '/service-categories/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.deactivateServiceCategory
);

// ==================== PAYMENT METHOD ROUTES ====================

/**
 * @route   GET /api/v1/master-data/payment-methods
 * @desc    Get all payment methods
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get('/payment-methods', authorize(...authorizedRoles), MasterDataController.getAllPaymentMethods);

/**
 * @route   GET /api/v1/master-data/payment-methods/:id
 * @desc    Get payment method by ID
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/payment-methods/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.getPaymentMethodById
);

/**
 * @route   POST /api/v1/master-data/payment-methods
 * @desc    Create a new payment method
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post('/payment-methods', authorize(...authorizedRoles), MasterDataController.createPaymentMethod);

/**
 * @route   PUT /api/v1/master-data/payment-methods/:id
 * @desc    Update payment method
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.put(
  '/payment-methods/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.updatePaymentMethod
);

/**
 * @route   DELETE /api/v1/master-data/payment-methods/:id
 * @desc    Deactivate payment method (soft delete)
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.delete(
  '/payment-methods/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.deactivatePaymentMethod
);

// ==================== EXPENSE CATEGORY ROUTES ====================

/**
 * @route   GET /api/v1/master-data/expense-categories
 * @desc    Get all expense categories
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get('/expense-categories', authorize(...authorizedRoles), MasterDataController.getAllExpenseCategories);

/**
 * @route   GET /api/v1/master-data/expense-categories/:id
 * @desc    Get expense category by ID
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/expense-categories/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.getExpenseCategoryById
);

/**
 * @route   POST /api/v1/master-data/expense-categories
 * @desc    Create a new expense category
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post('/expense-categories', authorize(...authorizedRoles), MasterDataController.createExpenseCategory);

/**
 * @route   PUT /api/v1/master-data/expense-categories/:id
 * @desc    Update expense category
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.put(
  '/expense-categories/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.updateExpenseCategory
);

/**
 * @route   DELETE /api/v1/master-data/expense-categories/:id
 * @desc    Deactivate expense category (soft delete)
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.delete(
  '/expense-categories/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.deactivateExpenseCategory
);

// ==================== DEVICE CONDITION ROUTES ====================

/**
 * @route   GET /api/v1/master-data/device-conditions
 * @desc    Get all device conditions
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get('/device-conditions', authorize(...authorizedRoles), MasterDataController.getAllDeviceConditions);

/**
 * @route   GET /api/v1/master-data/device-conditions/:id
 * @desc    Get device condition by ID
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.get(
  '/device-conditions/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.getDeviceConditionById
);

/**
 * @route   POST /api/v1/master-data/device-conditions
 * @desc    Create a new device condition
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.post('/device-conditions', authorize(...authorizedRoles), MasterDataController.createDeviceCondition);

/**
 * @route   PUT /api/v1/master-data/device-conditions/:id
 * @desc    Update device condition
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.put(
  '/device-conditions/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.updateDeviceCondition
);

/**
 * @route   DELETE /api/v1/master-data/device-conditions/:id
 * @desc    Deactivate device condition (soft delete)
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.delete(
  '/device-conditions/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  MasterDataController.deactivateDeviceCondition
);

export default router;
