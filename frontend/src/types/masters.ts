// Base interface for all master data items
export interface MasterDataBase {
  id: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Item Category
export interface ItemCategory extends MasterDataBase {
  name: string;
  code?: string;
  description?: string;
}

export interface CreateItemCategoryDto {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateItemCategoryDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// Item Unit
export interface ItemUnit extends MasterDataBase {
  name: string;
  code: string;
  symbol?: string;
  description?: string;
}

export interface CreateItemUnitDto {
  name: string;
  code: string;
  symbol?: string;
  description?: string;
}

export interface UpdateItemUnitDto {
  name?: string;
  code?: string;
  symbol?: string;
  description?: string;
  isActive?: boolean;
}

// Item GST Rate
export interface ItemGSTRate extends MasterDataBase {
  name: string;
  rate: number;
  description?: string;
}

export interface CreateItemGSTRateDto {
  name: string;
  rate: number;
  description?: string;
}

export interface UpdateItemGSTRateDto {
  name?: string;
  rate?: number;
  description?: string;
  isActive?: boolean;
}

// Item Brand
export interface ItemBrand extends MasterDataBase {
  name: string;
  code?: string;
  description?: string;
  _count?: {
    models: number;
    inventories: number;
  };
}

export interface CreateItemBrandDto {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateItemBrandDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// Item Model
export interface ItemModel extends MasterDataBase {
  name: string;
  code?: string;
  description?: string;
  brandId?: string;
  brand?: {
    id: string;
    name: string;
    code?: string;
  };
  _count?: {
    inventories: number;
  };
}

export interface CreateItemModelDto {
  name: string;
  code?: string;
  description?: string;
  brandId?: string;
}

export interface UpdateItemModelDto {
  name?: string;
  code?: string;
  description?: string;
  brandId?: string;
  isActive?: boolean;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Fault
export interface Fault extends MasterDataBase {
  name: string;
  code?: string;
  description?: string;
  tags?: string;
  defaultPrice: number;
  technicianPoints: number;
}

export interface CreateFaultDto {
  name: string;
  code?: string;
  description?: string;
  tags?: string;
  defaultPrice?: number;
  technicianPoints?: number;
}

export interface UpdateFaultDto {
  name?: string;
  code?: string;
  description?: string;
  tags?: string;
  defaultPrice?: number;
  technicianPoints?: number;
  isActive?: boolean;
}

// Payment Method
export interface PaymentMethod extends MasterDataBase {
  name: string;
  code: string;
  description?: string;
}

export interface CreatePaymentMethodDto {
  name: string;
  code: string;
  description?: string;
}

export interface UpdatePaymentMethodDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// Expense Category
export interface ExpenseCategory extends MasterDataBase {
  name: string;
  code?: string;
  description?: string;
}

export interface CreateExpenseCategoryDto {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateExpenseCategoryDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// Device Condition
export interface DeviceCondition extends MasterDataBase {
  name: string;
  code: string;
  description?: string;
}

export interface CreateDeviceConditionDto {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateDeviceConditionDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// Damage Condition
export interface DamageCondition extends MasterDataBase {
  name: string;
  description?: string;
}

export interface CreateDamageConditionDto {
  name: string;
  description?: string;
}

export interface UpdateDamageConditionDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Service Issue (Alias for DamageCondition - backward compatibility)
export type ServiceIssue = DamageCondition;
export type CreateServiceIssueDto = CreateDamageConditionDto;
export type UpdateServiceIssueDto = UpdateDamageConditionDto;

// Accessory (Global - not company scoped)
export interface Accessory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccessoryDto {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateAccessoryDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// Master Data Type enum
export enum MasterDataType {
  CATEGORY = 'category',
  UNIT = 'unit',
  GST_RATE = 'gst-rate',
  BRAND = 'brand',
  MODEL = 'model',
  SERVICE_CATEGORY = 'service-category',
  PAYMENT_METHOD = 'payment-method',
  EXPENSE_CATEGORY = 'expense-category',
  DEVICE_CONDITION = 'device-condition',
  DAMAGE_CONDITION = 'damage-condition',
  ACCESSORY = 'accessory',
}

// Generic Master Data Item type
export type MasterDataItem = ItemCategory | ItemUnit | ItemGSTRate | ItemBrand | ItemModel | ServiceCategory | PaymentMethod | ExpenseCategory | DeviceCondition | DamageCondition | Accessory;
export type CreateMasterDataDto = CreateItemCategoryDto | CreateItemUnitDto | CreateItemGSTRateDto | CreateItemBrandDto | CreateItemModelDto | CreateServiceCategoryDto | CreatePaymentMethodDto | CreateExpenseCategoryDto | CreateDeviceConditionDto | CreateDamageConditionDto | CreateAccessoryDto;
export type UpdateMasterDataDto = UpdateItemCategoryDto | UpdateItemUnitDto | UpdateItemGSTRateDto | UpdateItemBrandDto | UpdateItemModelDto | UpdateServiceCategoryDto | UpdatePaymentMethodDto | UpdateExpenseCategoryDto | UpdateDeviceConditionDto | UpdateDamageConditionDto | UpdateAccessoryDto;
