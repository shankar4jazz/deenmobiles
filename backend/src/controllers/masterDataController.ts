import { Response } from 'express';
import { MasterDataService } from '../services/masterDataService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class MasterDataController {
  // ==================== ITEM CATEGORY ENDPOINTS ====================

  /**
   * GET /api/v1/master-data/categories
   * Get all item categories
   */
  static getAllCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const filters = {
      companyId,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page,
      limit,
    };

    const result = await MasterDataService.getAllCategories(filters);

    return ApiResponse.success(res, result, 'Categories retrieved successfully');
  });

  /**
   * GET /api/v1/master-data/categories/:id
   * Get category by ID
   */
  static getCategoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const category = await MasterDataService.getCategoryById(id, companyId);

    return ApiResponse.success(res, category, 'Category retrieved successfully');
  });

  /**
   * POST /api/v1/master-data/categories
   * Create a new item category
   */
  static createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, code, description } = req.body;
    const companyId = req.user!.companyId;

    const category = await MasterDataService.createCategory({
      name,
      code,
      description,
      companyId,
    });

    return ApiResponse.created(res, category, 'Category created successfully');
  });

  /**
   * PUT /api/v1/master-data/categories/:id
   * Update item category
   */
  static updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const category = await MasterDataService.updateCategory(id, companyId, updateData);

    return ApiResponse.success(res, category, 'Category updated successfully');
  });

  /**
   * DELETE /api/v1/master-data/categories/:id
   * Deactivate category (soft delete)
   */
  static deactivateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const category = await MasterDataService.deactivateCategory(id, companyId);

    return ApiResponse.success(res, category, 'Category deactivated successfully');
  });

  // ==================== ITEM UNIT ENDPOINTS ====================

  /**
   * GET /api/v1/master-data/units
   * Get all item units
   */
  static getAllUnits = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const filters = {
      companyId,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page,
      limit,
    };

    const result = await MasterDataService.getAllUnits(filters);

    return ApiResponse.success(res, result, 'Units retrieved successfully');
  });

  /**
   * GET /api/v1/master-data/units/:id
   * Get unit by ID
   */
  static getUnitById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const unit = await MasterDataService.getUnitById(id, companyId);

    return ApiResponse.success(res, unit, 'Unit retrieved successfully');
  });

  /**
   * POST /api/v1/master-data/units
   * Create a new item unit
   */
  static createUnit = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, code, symbol, description } = req.body;
    const companyId = req.user!.companyId;

    const unit = await MasterDataService.createUnit({
      name,
      code,
      symbol,
      description,
      companyId,
    });

    return ApiResponse.created(res, unit, 'Unit created successfully');
  });

  /**
   * PUT /api/v1/master-data/units/:id
   * Update item unit
   */
  static updateUnit = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const unit = await MasterDataService.updateUnit(id, companyId, updateData);

    return ApiResponse.success(res, unit, 'Unit updated successfully');
  });

  /**
   * DELETE /api/v1/master-data/units/:id
   * Deactivate unit (soft delete)
   */
  static deactivateUnit = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const unit = await MasterDataService.deactivateUnit(id, companyId);

    return ApiResponse.success(res, unit, 'Unit deactivated successfully');
  });

  // ==================== ITEM GST RATE ENDPOINTS ====================

  /**
   * GET /api/v1/master-data/gst-rates
   * Get all GST rates
   */
  static getAllGSTRates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const filters = {
      companyId,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page,
      limit,
    };

    const result = await MasterDataService.getAllGSTRates(filters);

    return ApiResponse.success(res, result, 'GST rates retrieved successfully');
  });

  /**
   * GET /api/v1/master-data/gst-rates/:id
   * Get GST rate by ID
   */
  static getGSTRateById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const gstRate = await MasterDataService.getGSTRateById(id, companyId);

    return ApiResponse.success(res, gstRate, 'GST rate retrieved successfully');
  });

  /**
   * POST /api/v1/master-data/gst-rates
   * Create a new GST rate
   */
  static createGSTRate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, rate, description } = req.body;
    const companyId = req.user!.companyId;

    const gstRate = await MasterDataService.createGSTRate({
      name,
      rate: parseFloat(rate),
      description,
      companyId,
    });

    return ApiResponse.created(res, gstRate, 'GST rate created successfully');
  });

  /**
   * PUT /api/v1/master-data/gst-rates/:id
   * Update GST rate
   */
  static updateGSTRate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    // Convert rate to float if provided
    if (updateData.rate !== undefined) {
      updateData.rate = parseFloat(updateData.rate);
    }

    const gstRate = await MasterDataService.updateGSTRate(id, companyId, updateData);

    return ApiResponse.success(res, gstRate, 'GST rate updated successfully');
  });

  /**
   * DELETE /api/v1/master-data/gst-rates/:id
   * Deactivate GST rate (soft delete)
   */
  static deactivateGSTRate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const gstRate = await MasterDataService.deactivateGSTRate(id, companyId);

    return ApiResponse.success(res, gstRate, 'GST rate deactivated successfully');
  });

  // ==================== ITEM BRAND ENDPOINTS ====================

  /**
   * GET /api/v1/master-data/brands
   * Get all item brands
   */
  static getAllBrands = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const filters = {
      companyId,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page,
      limit,
    };

    const result = await MasterDataService.getAllBrands(filters);

    return ApiResponse.success(res, result, 'Brands retrieved successfully');
  });

  /**
   * GET /api/v1/master-data/brands/:id
   * Get brand by ID
   */
  static getBrandById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const brand = await MasterDataService.getBrandById(id, companyId);

    return ApiResponse.success(res, brand, 'Brand retrieved successfully');
  });

  /**
   * POST /api/v1/master-data/brands
   * Create a new item brand
   */
  static createBrand = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, code, description } = req.body;
    const companyId = req.user!.companyId;

    const brand = await MasterDataService.createBrand({
      name,
      code,
      description,
      companyId,
    });

    return ApiResponse.created(res, brand, 'Brand created successfully');
  });

  /**
   * PUT /api/v1/master-data/brands/:id
   * Update item brand
   */
  static updateBrand = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const brand = await MasterDataService.updateBrand(id, companyId, updateData);

    return ApiResponse.success(res, brand, 'Brand updated successfully');
  });

  /**
   * DELETE /api/v1/master-data/brands/:id
   * Deactivate brand (soft delete)
   */
  static deactivateBrand = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const brand = await MasterDataService.deactivateBrand(id, companyId);

    return ApiResponse.success(res, brand, 'Brand deactivated successfully');
  });

  // ==================== ITEM MODEL ENDPOINTS ====================

  /**
   * GET /api/v1/master-data/models
   * Get all item models
   */
  static getAllModels = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const filters = {
      companyId,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      brandId: req.query.brandId as string,
      page,
      limit,
    };

    const result = await MasterDataService.getAllModels(filters);

    return ApiResponse.success(res, result, 'Models retrieved successfully');
  });

  /**
   * GET /api/v1/master-data/models/:id
   * Get model by ID
   */
  static getModelById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const model = await MasterDataService.getModelById(id, companyId);

    return ApiResponse.success(res, model, 'Model retrieved successfully');
  });

  /**
   * POST /api/v1/master-data/models
   * Create a new item model
   */
  static createModel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, code, description, brandId } = req.body;
    const companyId = req.user!.companyId;

    const model = await MasterDataService.createModel({
      name,
      code,
      description,
      brandId,
      companyId,
    });

    return ApiResponse.created(res, model, 'Model created successfully');
  });

  /**
   * PUT /api/v1/master-data/models/:id
   * Update item model
   */
  static updateModel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const model = await MasterDataService.updateModel(id, companyId, updateData);

    return ApiResponse.success(res, model, 'Model updated successfully');
  });

  /**
   * DELETE /api/v1/master-data/models/:id
   * Deactivate model (soft delete)
   */
  static deactivateModel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const model = await MasterDataService.deactivateModel(id, companyId);

    return ApiResponse.success(res, model, 'Model deactivated successfully');
  });

  // ==================== SERVICE CATEGORY ENDPOINTS ====================

  /**
   * GET /api/v1/master-data/service-categories
   * Get all service categories
   */
  static getAllServiceCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const filters = {
      companyId,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page,
      limit,
    };

    const result = await MasterDataService.getAllServiceCategories(filters);

    return ApiResponse.success(res, result, 'Service categories retrieved successfully');
  });

  /**
   * GET /api/v1/master-data/service-categories/:id
   * Get service category by ID
   */
  static getServiceCategoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const serviceCategory = await MasterDataService.getServiceCategoryById(id, companyId);

    return ApiResponse.success(res, serviceCategory, 'Service category retrieved successfully');
  });

  /**
   * POST /api/v1/master-data/service-categories
   * Create a new service category
   */
  static createServiceCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, code, description, defaultPrice, technicianPoints } = req.body;
    const companyId = req.user!.companyId;

    const serviceCategory = await MasterDataService.createServiceCategory({
      name,
      code,
      description,
      defaultPrice: defaultPrice !== undefined ? parseFloat(defaultPrice) : undefined,
      technicianPoints: technicianPoints !== undefined ? parseInt(technicianPoints) : undefined,
      companyId,
    });

    return ApiResponse.created(res, serviceCategory, 'Service category created successfully');
  });

  /**
   * PUT /api/v1/master-data/service-categories/:id
   * Update service category
   */
  static updateServiceCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    // Convert numeric fields if provided
    if (updateData.defaultPrice !== undefined) {
      updateData.defaultPrice = parseFloat(updateData.defaultPrice);
    }
    if (updateData.technicianPoints !== undefined) {
      updateData.technicianPoints = parseInt(updateData.technicianPoints);
    }

    const serviceCategory = await MasterDataService.updateServiceCategory(id, companyId, updateData);

    return ApiResponse.success(res, serviceCategory, 'Service category updated successfully');
  });

  /**
   * DELETE /api/v1/master-data/service-categories/:id
   * Deactivate service category (soft delete)
   */
  static deactivateServiceCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const serviceCategory = await MasterDataService.deactivateServiceCategory(id, companyId);

    return ApiResponse.success(res, serviceCategory, 'Service category deactivated successfully');
  });

  // ==================== PAYMENT METHOD ENDPOINTS ====================

  /**
   * GET /api/v1/master-data/payment-methods
   * Get all payment methods
   */
  static getAllPaymentMethods = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const filters = {
      companyId,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page,
      limit,
    };

    const result = await MasterDataService.getAllPaymentMethods(filters);

    return ApiResponse.success(res, result, 'Payment methods retrieved successfully');
  });

  /**
   * GET /api/v1/master-data/payment-methods/:id
   * Get payment method by ID
   */
  static getPaymentMethodById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const paymentMethod = await MasterDataService.getPaymentMethodById(id, companyId);

    return ApiResponse.success(res, paymentMethod, 'Payment method retrieved successfully');
  });

  /**
   * POST /api/v1/master-data/payment-methods
   * Create a new payment method
   */
  static createPaymentMethod = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, code, description } = req.body;
    const companyId = req.user!.companyId;

    const paymentMethod = await MasterDataService.createPaymentMethod({
      name,
      code,
      description,
      companyId,
    });

    return ApiResponse.created(res, paymentMethod, 'Payment method created successfully');
  });

  /**
   * PUT /api/v1/master-data/payment-methods/:id
   * Update payment method
   */
  static updatePaymentMethod = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const paymentMethod = await MasterDataService.updatePaymentMethod(id, companyId, updateData);

    return ApiResponse.success(res, paymentMethod, 'Payment method updated successfully');
  });

  /**
   * DELETE /api/v1/master-data/payment-methods/:id
   * Deactivate payment method (soft delete)
   */
  static deactivatePaymentMethod = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const paymentMethod = await MasterDataService.deactivatePaymentMethod(id, companyId);

    return ApiResponse.success(res, paymentMethod, 'Payment method deactivated successfully');
  });

  // ==================== EXPENSE CATEGORY ENDPOINTS ====================

  /**
   * GET /api/v1/master-data/expense-categories
   * Get all expense categories
   */
  static getAllExpenseCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const filters = {
      companyId,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page,
      limit,
    };

    const result = await MasterDataService.getAllExpenseCategories(filters);

    return ApiResponse.success(res, result, 'Expense categories retrieved successfully');
  });

  /**
   * GET /api/v1/master-data/expense-categories/:id
   * Get expense category by ID
   */
  static getExpenseCategoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const expenseCategory = await MasterDataService.getExpenseCategoryById(id, companyId);

    return ApiResponse.success(res, expenseCategory, 'Expense category retrieved successfully');
  });

  /**
   * POST /api/v1/master-data/expense-categories
   * Create a new expense category
   */
  static createExpenseCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, code, description } = req.body;
    const companyId = req.user!.companyId;

    const expenseCategory = await MasterDataService.createExpenseCategory({
      name,
      code,
      description,
      companyId,
    });

    return ApiResponse.created(res, expenseCategory, 'Expense category created successfully');
  });

  /**
   * PUT /api/v1/master-data/expense-categories/:id
   * Update expense category
   */
  static updateExpenseCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const expenseCategory = await MasterDataService.updateExpenseCategory(id, companyId, updateData);

    return ApiResponse.success(res, expenseCategory, 'Expense category updated successfully');
  });

  /**
   * DELETE /api/v1/master-data/expense-categories/:id
   * Deactivate expense category (soft delete)
   */
  static deactivateExpenseCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const expenseCategory = await MasterDataService.deactivateExpenseCategory(id, companyId);

    return ApiResponse.success(res, expenseCategory, 'Expense category deactivated successfully');
  });

  // ==================== DEVICE CONDITION ENDPOINTS ====================

  /**
   * GET /api/v1/master-data/device-conditions
   * Get all device conditions
   */
  static getAllDeviceConditions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { search, isActive, page, limit } = req.query;

    const result = await MasterDataService.getAllDeviceConditions({
      companyId,
      search: search as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return ApiResponse.success(res, result, 'Device conditions retrieved successfully');
  });

  /**
   * GET /api/v1/master-data/device-conditions/:id
   * Get device condition by ID
   */
  static getDeviceConditionById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const deviceCondition = await MasterDataService.getDeviceConditionById(id, companyId);

    return ApiResponse.success(res, deviceCondition, 'Device condition retrieved successfully');
  });

  /**
   * POST /api/v1/master-data/device-conditions
   * Create a new device condition
   */
  static createDeviceCondition = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, code, description } = req.body;
    const companyId = req.user!.companyId;

    const deviceCondition = await MasterDataService.createDeviceCondition({
      name,
      code,
      description,
      companyId,
    });

    return ApiResponse.created(res, deviceCondition, 'Device condition created successfully');
  });

  /**
   * PUT /api/v1/master-data/device-conditions/:id
   * Update device condition
   */
  static updateDeviceCondition = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const deviceCondition = await MasterDataService.updateDeviceCondition(id, companyId, updateData);

    return ApiResponse.success(res, deviceCondition, 'Device condition updated successfully');
  });

  /**
   * DELETE /api/v1/master-data/device-conditions/:id
   * Deactivate device condition (soft delete)
   */
  static deactivateDeviceCondition = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const deviceCondition = await MasterDataService.deactivateDeviceCondition(id, companyId);

    return ApiResponse.success(res, deviceCondition, 'Device condition deactivated successfully');
  });

  // ==================== SERVICE ISSUE ENDPOINTS ====================

  /**
   * GET /api/v1/master-data/service-issues
   * Get all service issues
   */
  static getAllServiceIssues = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { search, isActive, page, limit } = req.query;

    const result = await MasterDataService.getAllServiceIssues({
      companyId,
      search: search as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return ApiResponse.success(res, result, 'Service issues retrieved successfully');
  });

  /**
   * GET /api/v1/master-data/service-issues/:id
   * Get service issue by ID
   */
  static getServiceIssueById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const serviceIssue = await MasterDataService.getServiceIssueById(id, companyId);

    return ApiResponse.success(res, serviceIssue, 'Service issue retrieved successfully');
  });

  /**
   * POST /api/v1/master-data/service-issues
   * Create a new service issue
   */
  static createServiceIssue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description } = req.body;
    const companyId = req.user!.companyId;

    const serviceIssue = await MasterDataService.createServiceIssue({
      name,
      description,
      companyId,
    });

    return ApiResponse.created(res, serviceIssue, 'Service issue created successfully');
  });

  /**
   * PUT /api/v1/master-data/service-issues/:id
   * Update service issue
   */
  static updateServiceIssue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    const serviceIssue = await MasterDataService.updateServiceIssue(id, companyId, updateData);

    return ApiResponse.success(res, serviceIssue, 'Service issue updated successfully');
  });

  /**
   * DELETE /api/v1/master-data/service-issues/:id
   * Deactivate service issue (soft delete)
   */
  static deactivateServiceIssue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const serviceIssue = await MasterDataService.deactivateServiceIssue(id, companyId);

    return ApiResponse.success(res, serviceIssue, 'Service issue deactivated successfully');
  });
}
