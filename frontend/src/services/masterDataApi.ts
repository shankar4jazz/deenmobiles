import { api } from './api';
import {
  ItemCategory,
  ItemUnit,
  ItemGSTRate,
  ItemBrand,
  ItemModel,
  ServiceCategory,
  PaymentMethod,
  ExpenseCategory,
  DeviceCondition,
  CreateItemCategoryDto,
  CreateItemUnitDto,
  CreateItemGSTRateDto,
  CreateItemBrandDto,
  CreateItemModelDto,
  CreateServiceCategoryDto,
  CreatePaymentMethodDto,
  CreateExpenseCategoryDto,
  CreateDeviceConditionDto,
  UpdateItemCategoryDto,
  UpdateItemUnitDto,
  UpdateItemGSTRateDto,
  UpdateItemBrandDto,
  UpdateItemModelDto,
  UpdateServiceCategoryDto,
  UpdatePaymentMethodDto,
  UpdateExpenseCategoryDto,
  UpdateDeviceConditionDto,
  PaginatedResponse,
} from '../types/masters';

interface MasterDataFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface ModelFilters extends MasterDataFilters {
  brandId?: string;
}

// ==================== ITEM CATEGORY API ====================
export const categoryApi = {
  /**
   * Get all item categories
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<ItemCategory>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/categories?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get category by ID
   */
  getById: async (id: string): Promise<ItemCategory> => {
    const response = await api.get(`/master-data/categories/${id}`);
    return response.data.data;
  },

  /**
   * Create a new category
   */
  create: async (data: CreateItemCategoryDto): Promise<ItemCategory> => {
    const response = await api.post('/master-data/categories', data);
    return response.data.data;
  },

  /**
   * Update a category
   */
  update: async (id: string, data: UpdateItemCategoryDto): Promise<ItemCategory> => {
    const response = await api.put(`/master-data/categories/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate a category
   */
  deactivate: async (id: string): Promise<ItemCategory> => {
    const response = await api.delete(`/master-data/categories/${id}`);
    return response.data.data;
  },
};

// ==================== ITEM UNIT API ====================
export const unitApi = {
  /**
   * Get all item units
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<ItemUnit>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/units?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get unit by ID
   */
  getById: async (id: string): Promise<ItemUnit> => {
    const response = await api.get(`/master-data/units/${id}`);
    return response.data.data;
  },

  /**
   * Create a new unit
   */
  create: async (data: CreateItemUnitDto): Promise<ItemUnit> => {
    const response = await api.post('/master-data/units', data);
    return response.data.data;
  },

  /**
   * Update a unit
   */
  update: async (id: string, data: UpdateItemUnitDto): Promise<ItemUnit> => {
    const response = await api.put(`/master-data/units/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate a unit
   */
  deactivate: async (id: string): Promise<ItemUnit> => {
    const response = await api.delete(`/master-data/units/${id}`);
    return response.data.data;
  },
};

// ==================== ITEM GST RATE API ====================
export const gstRateApi = {
  /**
   * Get all GST rates
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<ItemGSTRate>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/gst-rates?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get GST rate by ID
   */
  getById: async (id: string): Promise<ItemGSTRate> => {
    const response = await api.get(`/master-data/gst-rates/${id}`);
    return response.data.data;
  },

  /**
   * Create a new GST rate
   */
  create: async (data: CreateItemGSTRateDto): Promise<ItemGSTRate> => {
    const response = await api.post('/master-data/gst-rates', data);
    return response.data.data;
  },

  /**
   * Update a GST rate
   */
  update: async (id: string, data: UpdateItemGSTRateDto): Promise<ItemGSTRate> => {
    const response = await api.put(`/master-data/gst-rates/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate a GST rate
   */
  deactivate: async (id: string): Promise<ItemGSTRate> => {
    const response = await api.delete(`/master-data/gst-rates/${id}`);
    return response.data.data;
  },
};

// ==================== ITEM BRAND API ====================
export const brandApi = {
  /**
   * Get all item brands
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<ItemBrand>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/brands?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get brand by ID
   */
  getById: async (id: string): Promise<ItemBrand> => {
    const response = await api.get(`/master-data/brands/${id}`);
    return response.data.data;
  },

  /**
   * Create a new brand
   */
  create: async (data: CreateItemBrandDto): Promise<ItemBrand> => {
    const response = await api.post('/master-data/brands', data);
    return response.data.data;
  },

  /**
   * Update a brand
   */
  update: async (id: string, data: UpdateItemBrandDto): Promise<ItemBrand> => {
    const response = await api.put(`/master-data/brands/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate a brand
   */
  deactivate: async (id: string): Promise<ItemBrand> => {
    const response = await api.delete(`/master-data/brands/${id}`);
    return response.data.data;
  },
};

// ==================== ITEM MODEL API ====================
export const modelApi = {
  /**
   * Get all item models
   */
  getAll: async (filters?: ModelFilters): Promise<PaginatedResponse<ItemModel>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());
    if (filters?.brandId) params.append('brandId', filters.brandId);

    const response = await api.get(`/master-data/models?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get model by ID
   */
  getById: async (id: string): Promise<ItemModel> => {
    const response = await api.get(`/master-data/models/${id}`);
    return response.data.data;
  },

  /**
   * Create a new model
   */
  create: async (data: CreateItemModelDto): Promise<ItemModel> => {
    const response = await api.post('/master-data/models', data);
    return response.data.data;
  },

  /**
   * Update a model
   */
  update: async (id: string, data: UpdateItemModelDto): Promise<ItemModel> => {
    const response = await api.put(`/master-data/models/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate a model
   */
  deactivate: async (id: string): Promise<ItemModel> => {
    const response = await api.delete(`/master-data/models/${id}`);
    return response.data.data;
  },
};

// ==================== SERVICE CATEGORY API ====================
export const serviceCategoryApi = {
  /**
   * Get all service categories
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<ServiceCategory>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/service-categories?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get service category by ID
   */
  getById: async (id: string): Promise<ServiceCategory> => {
    const response = await api.get(`/master-data/service-categories/${id}`);
    return response.data.data;
  },

  /**
   * Create a new service category
   */
  create: async (data: CreateServiceCategoryDto): Promise<ServiceCategory> => {
    const response = await api.post('/master-data/service-categories', data);
    return response.data.data;
  },

  /**
   * Update a service category
   */
  update: async (id: string, data: UpdateServiceCategoryDto): Promise<ServiceCategory> => {
    const response = await api.put(`/master-data/service-categories/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate a service category
   */
  deactivate: async (id: string): Promise<ServiceCategory> => {
    const response = await api.delete(`/master-data/service-categories/${id}`);
    return response.data.data;
  },
};

// ==================== PAYMENT METHOD API ====================
export const paymentMethodApi = {
  /**
   * Get all payment methods
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<PaymentMethod>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/payment-methods?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get payment method by ID
   */
  getById: async (id: string): Promise<PaymentMethod> => {
    const response = await api.get(`/master-data/payment-methods/${id}`);
    return response.data.data;
  },

  /**
   * Create a new payment method
   */
  create: async (data: CreatePaymentMethodDto): Promise<PaymentMethod> => {
    const response = await api.post('/master-data/payment-methods', data);
    return response.data.data;
  },

  /**
   * Update a payment method
   */
  update: async (id: string, data: UpdatePaymentMethodDto): Promise<PaymentMethod> => {
    const response = await api.put(`/master-data/payment-methods/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate a payment method
   */
  deactivate: async (id: string): Promise<PaymentMethod> => {
    const response = await api.delete(`/master-data/payment-methods/${id}`);
    return response.data.data;
  },
};

// ==================== EXPENSE CATEGORY API ====================
export const expenseCategoryApi = {
  /**
   * Get all expense categories
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<ExpenseCategory>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/expense-categories?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get expense category by ID
   */
  getById: async (id: string): Promise<ExpenseCategory> => {
    const response = await api.get(`/master-data/expense-categories/${id}`);
    return response.data.data;
  },

  /**
   * Create a new expense category
   */
  create: async (data: CreateExpenseCategoryDto): Promise<ExpenseCategory> => {
    const response = await api.post('/master-data/expense-categories', data);
    return response.data.data;
  },

  /**
   * Update an expense category
   */
  update: async (id: string, data: UpdateExpenseCategoryDto): Promise<ExpenseCategory> => {
    const response = await api.put(`/master-data/expense-categories/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate an expense category
   */
  deactivate: async (id: string): Promise<ExpenseCategory> => {
    const response = await api.delete(`/master-data/expense-categories/${id}`);
    return response.data.data;
  },
};

// ==================== DEVICE CONDITION API ====================
export const deviceConditionApi = {
  /**
   * Get all device conditions
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<DeviceCondition>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/device-conditions?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get device condition by ID
   */
  getById: async (id: string): Promise<DeviceCondition> => {
    const response = await api.get(`/master-data/device-conditions/${id}`);
    return response.data.data;
  },

  /**
   * Create a new device condition
   */
  create: async (data: CreateDeviceConditionDto): Promise<DeviceCondition> => {
    const response = await api.post('/master-data/device-conditions', data);
    return response.data.data;
  },

  /**
   * Update a device condition
   */
  update: async (id: string, data: UpdateDeviceConditionDto): Promise<DeviceCondition> => {
    const response = await api.put(`/master-data/device-conditions/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate a device condition
   */
  deactivate: async (id: string): Promise<DeviceCondition> => {
    const response = await api.delete(`/master-data/device-conditions/${id}`);
    return response.data.data;
  },
};

// Combined export for convenience
export const masterDataApi = {
  categories: categoryApi,
  units: unitApi,
  gstRates: gstRateApi,
  brands: brandApi,
  models: modelApi,
  serviceCategories: serviceCategoryApi,
  paymentMethods: paymentMethodApi,
  expenseCategories: expenseCategoryApi,
  deviceConditions: deviceConditionApi,
  // Convenience methods for direct access
  getAllCategories: categoryApi.getAll,
  getAllUnits: unitApi.getAll,
  getAllGSTRates: gstRateApi.getAll,
  getAllBrands: brandApi.getAll,
  getAllModels: modelApi.getAll,
  getAllServiceCategories: serviceCategoryApi.getAll,
  getAllPaymentMethods: paymentMethodApi.getAll,
  getAllExpenseCategories: expenseCategoryApi.getAll,
  getAllDeviceConditions: deviceConditionApi.getAll,
};
