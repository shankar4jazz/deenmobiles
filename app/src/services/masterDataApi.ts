import { api } from './api';
import {
  ItemCategory,
  ItemUnit,
  ItemGSTRate,
  ItemBrand,
  ItemModel,
  Fault,
  PaymentMethod,
  ExpenseCategory,
  DeviceCondition,
  DamageCondition,
  Accessory,
  InvoiceTerms,
  EstimationTerms,
  CreateItemCategoryDto,
  CreateItemUnitDto,
  CreateItemGSTRateDto,
  CreateItemBrandDto,
  CreateItemModelDto,
  CreateFaultDto,
  CreatePaymentMethodDto,
  CreateExpenseCategoryDto,
  CreateDeviceConditionDto,
  CreateDamageConditionDto,
  CreateAccessoryDto,
  CreateInvoiceTermsDto,
  CreateEstimationTermsDto,
  UpdateItemCategoryDto,
  UpdateItemUnitDto,
  UpdateItemGSTRateDto,
  UpdateItemBrandDto,
  UpdateItemModelDto,
  UpdateFaultDto,
  UpdatePaymentMethodDto,
  UpdateExpenseCategoryDto,
  UpdateDeviceConditionDto,
  UpdateDamageConditionDto,
  UpdateAccessoryDto,
  UpdateInvoiceTermsDto,
  UpdateEstimationTermsDto,
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

// ==================== FAULT API ====================
export const faultApi = {
  /**
   * Get all faults
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<Fault>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/faults?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get fault by ID
   */
  getById: async (id: string): Promise<Fault> => {
    const response = await api.get(`/master-data/faults/${id}`);
    return response.data.data;
  },

  /**
   * Create a new fault
   */
  create: async (data: CreateFaultDto): Promise<Fault> => {
    const response = await api.post('/master-data/faults', data);
    return response.data.data;
  },

  /**
   * Update a fault
   */
  update: async (id: string, data: UpdateFaultDto): Promise<Fault> => {
    const response = await api.put(`/master-data/faults/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate a fault
   */
  deactivate: async (id: string): Promise<Fault> => {
    const response = await api.delete(`/master-data/faults/${id}`);
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

// ==================== DAMAGE CONDITION API ====================
export const damageConditionApi = {
  /**
   * Get all damage conditions
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<DamageCondition>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/damage-conditions?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get damage condition by ID
   */
  getById: async (id: string): Promise<DamageCondition> => {
    const response = await api.get(`/master-data/damage-conditions/${id}`);
    return response.data.data;
  },

  /**
   * Create a new damage condition
   */
  create: async (data: CreateDamageConditionDto): Promise<DamageCondition> => {
    const response = await api.post('/master-data/damage-conditions', data);
    return response.data.data;
  },

  /**
   * Update a damage condition
   */
  update: async (id: string, data: UpdateDamageConditionDto): Promise<DamageCondition> => {
    const response = await api.put(`/master-data/damage-conditions/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate a damage condition
   */
  deactivate: async (id: string): Promise<DamageCondition> => {
    const response = await api.delete(`/master-data/damage-conditions/${id}`);
    return response.data.data;
  },
};

// ==================== ACCESSORY API (Global) ====================
export const accessoryApi = {
  /**
   * Get all accessories (global - not company scoped)
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<Accessory>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/accessories?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get accessory by ID
   */
  getById: async (id: string): Promise<Accessory> => {
    const response = await api.get(`/master-data/accessories/${id}`);
    return response.data.data;
  },

  /**
   * Create a new accessory
   */
  create: async (data: CreateAccessoryDto): Promise<Accessory> => {
    const response = await api.post('/master-data/accessories', data);
    return response.data.data;
  },

  /**
   * Update an accessory
   */
  update: async (id: string, data: UpdateAccessoryDto): Promise<Accessory> => {
    const response = await api.put(`/master-data/accessories/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate an accessory
   */
  deactivate: async (id: string): Promise<Accessory> => {
    const response = await api.delete(`/master-data/accessories/${id}`);
    return response.data.data;
  },
};

// ==================== INVOICE TERMS API ====================
export const invoiceTermsApi = {
  /**
   * Get all invoice terms
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<InvoiceTerms>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/invoice-terms?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Create a new invoice term
   */
  create: async (data: CreateInvoiceTermsDto): Promise<InvoiceTerms> => {
    const response = await api.post('/master-data/invoice-terms', data);
    return response.data.data;
  },

  /**
   * Update an invoice term
   */
  update: async (id: string, data: UpdateInvoiceTermsDto): Promise<InvoiceTerms> => {
    const response = await api.put(`/master-data/invoice-terms/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate an invoice term
   */
  deactivate: async (id: string): Promise<InvoiceTerms> => {
    const response = await api.delete(`/master-data/invoice-terms/${id}`);
    return response.data.data;
  },
};

// ==================== ESTIMATION TERMS API ====================
export const estimationTermsApi = {
  /**
   * Get all estimation terms
   */
  getAll: async (filters?: MasterDataFilters): Promise<PaginatedResponse<EstimationTerms>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/master-data/estimation-terms?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Create a new estimation term
   */
  create: async (data: CreateEstimationTermsDto): Promise<EstimationTerms> => {
    const response = await api.post('/master-data/estimation-terms', data);
    return response.data.data;
  },

  /**
   * Update an estimation term
   */
  update: async (id: string, data: UpdateEstimationTermsDto): Promise<EstimationTerms> => {
    const response = await api.put(`/master-data/estimation-terms/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate an estimation term
   */
  deactivate: async (id: string): Promise<EstimationTerms> => {
    const response = await api.delete(`/master-data/estimation-terms/${id}`);
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
  faults: faultApi,
  paymentMethods: paymentMethodApi,
  expenseCategories: expenseCategoryApi,
  deviceConditions: deviceConditionApi,
  damageConditions: damageConditionApi,
  serviceIssues: damageConditionApi, // Alias for backward compatibility
  accessories: accessoryApi,
  invoiceTerms: invoiceTermsApi,
  estimationTerms: estimationTermsApi,
  // Convenience methods for direct access
  getAllCategories: categoryApi.getAll,
  getAllUnits: unitApi.getAll,
  getAllGSTRates: gstRateApi.getAll,
  getAllBrands: brandApi.getAll,
  getAllModels: modelApi.getAll,
  getAllFaults: faultApi.getAll,
  getAllPaymentMethods: paymentMethodApi.getAll,
  getAllExpenseCategories: expenseCategoryApi.getAll,
  getAllDeviceConditions: deviceConditionApi.getAll,
  getAllDamageConditions: damageConditionApi.getAll,
  getAllAccessories: accessoryApi.getAll,
  getAllInvoiceTerms: invoiceTermsApi.getAll,
  getAllEstimationTerms: estimationTermsApi.getAll,
};
