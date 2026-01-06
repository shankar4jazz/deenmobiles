export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
  MANAGER = 'MANAGER',
  SERVICE_ADMIN = 'SERVICE_ADMIN',
  SERVICE_MANAGER = 'SERVICE_MANAGER',
  TECHNICIAN = 'TECHNICIAN',
  RECEPTIONIST = 'RECEPTIONIST',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
}

export enum ServiceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  accessToken: string;
  refreshToken?: string;
  managedBranchId?: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
  managedBranch?: {
    id: string;
    name: string;
    code: string;
  } | null;
  activeBranch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  companyId: string;
  managerId?: string | null;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  _count?: {
    users: number;
    customers?: number;
    services?: number;
  };
  users?: User[];
}

export interface BranchFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  managerId?: string;
  isActive: boolean;
}

export interface BranchFilters {
  search?: string;
  isActive?: boolean;
  managerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  whatsappNumber?: string;
  alternativeMobile?: string;
  address?: string;
  idProofType?: string;
  idProofDocument?: string;
  remarks?: string;
  companyId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
  _count?: {
    services: number;
  };
}

export interface CustomerFormData {
  name: string;
  phone: string;
  whatsappNumber?: string;
  alternativeMobile?: string;
  email?: string;
  address?: string;
  idProofType?: string;
  idProofDocument?: File;
  remarks?: string;
  branchId?: string;
}

export interface CustomerUpdateData {
  name?: string;
  phone?: string;
  whatsappNumber?: string;
  alternativeMobile?: string;
  email?: string;
  address?: string;
  idProofType?: string;
  idProofDocument?: File | null;
  remarks?: string;
  branchId?: string;
  removeIdProof?: boolean;
}

export interface CustomerFilters {
  search?: string;
  branchId?: string;
  page?: number;
  limit?: number;
}

// CustomerDevice Types
export interface CustomerDevice {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
  brandId: string;
  brand?: {
    id: string;
    name: string;
    code?: string;
  };
  modelId: string;
  model?: {
    id: string;
    name: string;
    code?: string;
  };
  imei?: string;
  color?: string;
  password?: string;
  conditionId?: string;
  condition?: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
  accessories: string[];
  purchaseYear?: number;
  notes?: string;
  isActive: boolean;
  companyId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    services: number;
  };
}

export interface CustomerDeviceFormData {
  customerId: string;
  brandId: string;
  modelId: string;
  imei?: string;
  color?: string;
  password?: string;
  conditionId?: string;
  accessories?: string[];
  purchaseYear?: number;
  notes?: string;
}

export interface CustomerDeviceUpdateData {
  brandId?: string;
  modelId?: string;
  imei?: string;
  color?: string;
  password?: string;
  conditionId?: string;
  accessories?: string[];
  purchaseYear?: number;
  notes?: string;
  isActive?: boolean;
}

export interface CustomerDeviceFilters {
  search?: string;
  isActive?: boolean;
  brandId?: string;
  modelId?: string;
  conditionId?: string;
  page?: number;
  limit?: number;
}

export interface CustomerDeviceSummary {
  totalDevices: number;
  activeDevices: number;
  inactiveDevices: number;
  devicesWithServices: number;
  devicesWithoutServices: number;
}

export interface Service {
  id: string;
  ticketNumber: string;
  customerId: string;
  customer?: Customer;
  deviceModel: string;
  deviceIMEI?: string;
  issue: string;
  estimatedCost: number;
  actualCost?: number;
  status: ServiceStatus;
  assignedToId?: string;
  assignedTo?: User;
  companyId: string;
  branchId: string;
  branch?: Branch;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

// Dashboard Types
export interface DashboardStats {
  totalServices: number;
  totalServicesChange: number;
  revenue: number;
  revenueChange: number;
  pendingServices: number;
  pendingServicesChange: number;
  completedToday: number;
  completedTodayChange: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  goal?: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'incoming' | 'outgoing' | 'neutral';
  timestamp: string;
}

export interface DashboardData {
  stats: DashboardStats;
  servicesChart: ChartDataPoint[];
  statusBreakdown: ChartDataPoint[];
  weeklyTrend: ChartDataPoint[];
  recentActivity: ActivityItem[];
}

// Permission Types
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGroup {
  resource: string;
  permissions: Permission[];
}

// Role Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  permissions?: {
    id: string;
    permission: Permission;
  }[];
  _count?: {
    users: number;
  };
}

export interface RoleFormData {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface RoleFilters {
  search?: string;
  isSystemRole?: boolean;
}

// Employee Types
export interface Employee extends User {
  username?: string;
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  customRoleId?: string;
  customRole?: Role;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

export interface EmployeeFormData {
  email: string;
  username?: string;
  password: string;
  name: string;
  phone?: string;
  profileImage?: File;
  role: UserRole;
  roleId?: string;
  customRoleId?: string;
  branchId?: string;
  isActive: boolean;
}

export interface EmployeeUpdateData {
  email?: string;
  username?: string;
  name?: string;
  phone?: string;
  profileImage?: File;
  role?: UserRole;
  roleId?: string;
  customRoleId?: string;
  branchId?: string;
  isActive?: boolean;
}

export interface EmployeeFilters {
  search?: string;
  role?: UserRole;
  branchId?: string;
  isActive?: boolean;
}

// Inventory & Supplier Enums
export enum InventoryCategory {
  ELECTRICAL = 'ELECTRICAL',
  MECHANICAL = 'MECHANICAL',
  DISPLAY = 'DISPLAY',
  BATTERY = 'BATTERY',
  ACCESSORY = 'ACCESSORY',
  CHARGER = 'CHARGER',
  CABLE = 'CABLE',
  CASE_COVER = 'CASE_COVER',
  SCREEN_PROTECTOR = 'SCREEN_PROTECTOR',
  AUDIO = 'AUDIO',
  CAMERA = 'CAMERA',
  OTHER = 'OTHER',
}

export enum Unit {
  PIECE = 'PIECE',
  METER = 'METER',
  LITRE = 'LITRE',
  KILOGRAM = 'KILOGRAM',
  BOX = 'BOX',
  SET = 'SET',
  PAIR = 'PAIR',
  ROLL = 'ROLL',
  PACKET = 'PACKET',
}

export enum GSTRate {
  ZERO = 'ZERO',
  FIVE = 'FIVE',
  TWELVE = 'TWELVE',
  EIGHTEEN = 'EIGHTEEN',
  TWENTY_EIGHT = 'TWENTY_EIGHT',
}

export enum TaxType {
  IGST = 'IGST',
  CGST_SGST = 'CGST_SGST',
}

export enum StockMovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  SERVICE_USE = 'SERVICE_USE',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
  OPENING_STOCK = 'OPENING_STOCK',
}

// Supplier Types
export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  active: boolean;
  companyId: string;
  company?: {
    id: string;
    name: string;
  };
  _count?: {
    inventories: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormData {
  supplierCode?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  active?: boolean;
}

export interface SupplierFilters {
  search?: string;
  active?: boolean;
  branchId?: string;
  page?: number;
  limit?: number;
}

// Inventory Types
export interface Inventory {
  id: string;
  partNumber: string;
  partName: string;
  description?: string;
  modelVariant?: string;
  brandName?: string;
  category?: InventoryCategory;
  categoryId?: string;
  unit: Unit;
  unitId?: string;
  purchasePrice?: number;
  salesPrice?: number;
  hsnCode: string;
  gstRate: GSTRate;
  gstRateId?: string;
  itemGSTRate?: {
    id: string;
    name: string;
    rate: number;
  };
  taxType: TaxType;
  stockQuantity: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  supplierId?: string;
  supplier?: {
    id: string;
    name: string;
    supplierCode: string;
    phone: string;
  };
  supplierInvoiceNumber?: string;
  purchaseDate?: string;
  billAttachmentUrl?: string;
  active: boolean;
  branchId: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  companyId: string;
  company?: {
    id: string;
    name: string;
  };
  _count?: {
    stockMovements: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InventoryFormData {
  partNumber?: string;
  partName: string;
  description?: string;
  modelVariant?: string;
  brandName?: string;
  category?: InventoryCategory;
  unit: Unit;
  purchasePrice?: number;
  salesPrice?: number;
  hsnCode: string;
  gstRate: GSTRate;
  taxType: TaxType;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  supplierId?: string;
  supplierInvoiceNumber?: string;
  purchaseDate?: string;
  billAttachment?: File;
  active?: boolean;
  branchId: string;
}

export interface InventoryFilters {
  search?: string;
  category?: InventoryCategory;
  brandName?: string;
  gstRate?: GSTRate;
  stockStatus?: 'all' | 'low' | 'out';
  active?: boolean;
  branchId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StockMovement {
  id: string;
  inventoryId: string;
  inventory?: {
    partNumber: string;
    partName: string;
    brandName?: string;
    unit: Unit;
  };
  branchInventoryId?: string;
  branchInventory?: {
    id: string;
    stockQuantity: number;
    item: {
      itemName: string;
      itemCode: string;
      itemCategory?: { name: string };
      itemBrand?: { name: string };
      itemUnit?: { name: string; symbol: string };
    };
  };
  movementType: StockMovementType;
  quantity: number;
  previousQty: number;
  newQty: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  userId: string;
  user?: {
    name: string;
    email: string;
    role?: UserRole;
    customRole?: {
      name: string;
    };
  };
  branchId: string;
  branch?: {
    name: string;
    code: string;
  };
  companyId: string;
  createdAt: string;
}

export interface StockAdjustmentData {
  quantity: number;
  movementType: StockMovementType;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

// ============================================================================
// Purchase Order Types
// ============================================================================

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  itemId: string;
  item?: {
    id: string;
    itemCode: string;
    itemName: string;
    itemBrand?: {
      id: string;
      name: string;
    };
    itemModel?: {
      id: string;
      name: string;
    };
    itemUnit?: {
      id: string;
      name: string;
      symbol?: string;
    };
  };
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  receivedQty: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  branchId: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  companyId: string;
  orderDate: string;
  expectedDelivery?: string;
  deliveryDate?: string;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  status: PurchaseOrderStatus;
  invoiceNumber?: string;
  invoiceDate?: string;
  notes?: string;
  createdBy: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
  payments?: SupplierPayment[];
}

export interface PurchaseOrderFormData {
  supplierId: string;
  branchId: string;
  orderDate?: string;
  expectedDelivery?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  notes?: string;
  items: {
    itemId: string;
    quantity: number;
    unitPrice: number;
    salesPrice?: number;
    taxRate: number;
  }[];
}

export interface PurchaseOrderFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  supplierId?: string;
  status?: PurchaseOrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReceiveItemsData {
  items: {
    itemId: string;
    receivedQty: number;
  }[];
  deliveryDate?: string;
  notes?: string;
}

export interface SupplierOutstanding {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  orders: {
    id: string;
    poNumber: string;
    orderDate: string;
    grandTotal: number;
    paidAmount: number;
    outstanding: number;
    status: PurchaseOrderStatus;
  }[];
}

// ============================================================================
// Supplier Payment Types
// ============================================================================

export interface SupplierPayment {
  id: string;
  purchaseOrderId: string;
  purchaseOrder?: {
    id: string;
    poNumber: string;
    grandTotal: number;
  };
  supplierId: string;
  supplier?: Supplier;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  companyId: string;
  createdBy: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface SupplierPaymentFormData {
  purchaseOrderId: string;
  supplierId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  branchId: string;
}

export interface SupplierPaymentFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  supplierId?: string;
  purchaseOrderId?: string;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierPaymentSummary {
  supplierId: string;
  supplierName: string;
  totalPayments: number;
  paymentCount: number;
  lastPaymentDate?: string;
  paymentsByMethod: {
    method: PaymentMethod;
    amount: number;
    count: number;
  }[];
}

// ============================================================================
// Purchase Return Types
// ============================================================================

export type PurchaseReturnReason =
  | 'DAMAGED'
  | 'WRONG_ITEM'
  | 'QUALITY_ISSUE'
  | 'EXCESS_STOCK'
  | 'EXPIRED'
  | 'OTHER';

export type PurchaseReturnType = 'REFUND' | 'REPLACEMENT';

export type PurchaseReturnStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface RefundTransaction {
  id: string;
  purchaseReturnId: string;
  refundAmount: number;
  refundDate: string;
  paymentMethodId?: string;
  referenceNumber?: string;
  notes?: string;
  processedBy: string;
  branchId: string;
  companyId: string;
  createdAt: string;
  paymentMethod?: {
    id: string;
    name: string;
    code: string;
  };
  processedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PurchaseItemReturn {
  id: string;
  purchaseOrderItemId: string;
  purchaseOrderItem?: {
    id: string;
    purchaseOrderId: string;
    inventoryId?: string;
    itemId?: string;
    quantity: number;
    unitPrice: number;
    receivedQty: number;
    returnedQty: number;
    inventory?: {
      partName: string;
      partNumber: string;
    };
    item?: {
      itemName: string;
      itemCode: string;
    };
    purchaseOrder?: {
      id: string;
      poNumber: string;
      supplier: {
        id: string;
        name: string;
      };
    };
  };
  returnQty: number;
  returnReason: PurchaseReturnReason;
  returnType: PurchaseReturnType;
  returnStatus: PurchaseReturnStatus;
  refundAmount: number;
  replacementPOId?: string;
  replacementPO?: {
    id: string;
    poNumber: string;
    status: PurchaseOrderStatus;
  };
  stockDeducted: boolean;
  refundProcessed?: boolean;
  notes?: string;
  returnDate: string;
  branchId: string;
  companyId: string;
  createdBy: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  refundTransactions?: RefundTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseReturnData {
  purchaseOrderItemId: string;
  returnQty: number;
  returnReason: PurchaseReturnReason;
  returnType: PurchaseReturnType;
  branchId: string;
  notes?: string;
}

// ============================================================================
// Item Types (Company-level catalog)
// ============================================================================

export interface Item {
  id: string;
  itemCode: string;
  barcode?: string;
  itemName: string;
  description?: string;
  modelVariant?: string;
  brandId?: string;
  modelId?: string;
  categoryId?: string;
  unitId?: string;
  purchasePrice?: number;
  salesPrice?: number;
  hsnCode?: string;
  gstRateId?: string;
  taxType?: TaxType;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  // Warranty fields
  warrantyDays?: number;
  warrantyType?: string;
  itemCategory?: {
    id: string;
    name: string;
  };
  itemUnit?: {
    id: string;
    name: string;
    symbol?: string;
  };
  itemGSTRate?: {
    id: string;
    name: string;
    rate: number;
  };
  itemBrand?: {
    id: string;
    name: string;
  };
  itemModel?: {
    id: string;
    name: string;
  };
  branchInventories?: {
    id: string;
    stockQuantity: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderLevel?: number;
    branch: {
      id: string;
      name: string;
      code: string;
    };
  }[];
  _count?: {
    branchInventories: number;
    purchaseOrderItems?: number;
  };
}

export interface ItemFormData {
  itemCode?: string;
  barcode?: string;
  itemName: string;
  description?: string;
  modelVariant?: string;
  brandId?: string;
  modelId?: string;
  categoryId?: string;
  unitId?: string;
  purchasePrice?: number;
  salesPrice?: number;
  hsnCode?: string;
  gstRateId?: string;
  taxType?: TaxType;
  isActive?: boolean;
  // Warranty fields
  warrantyDays?: number;
  warrantyType?: string;
}

export interface ItemFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  modelId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Branch Inventory Types (Branch-level stock)
// ============================================================================

export interface BranchInventory {
  id: string;
  itemId: string;
  item?: {
    id: string;
    itemCode: string;
    itemName: string;
    description?: string;
    modelVariant?: string;
    hsnCode?: string;
    itemCategory?: {
      id: string;
      name: string;
    };
    itemUnit?: {
      id: string;
      name: string;
    };
    itemGSTRate?: {
      id: string;
      name: string;
      rate: number;
    };
    itemBrand?: {
      id: string;
      name: string;
    };
    itemModel?: {
      id: string;
      name: string;
    };
    taxType?: TaxType;
    purchasePrice?: number;
    salesPrice?: number;
  };
  branchId: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  companyId: string;
  stockQuantity: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  supplierId?: string;
  supplier?: {
    id: string;
    name: string;
    supplierCode: string;
    phone: string;
  };
  lastPurchasePrice?: number;
  lastPurchaseDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    stockMovements: number;
  };
}

export interface BranchInventoryFormData {
  itemId: string;
  branchId: string;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  supplierId?: string;
  lastPurchasePrice?: number;
  lastPurchaseDate?: string;
}

export interface BranchInventoryUpdateData {
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  supplierId?: string;
  isActive?: boolean;
}

export interface BranchInventoryFilters {
  branchId?: string;
  itemId?: string;
  search?: string;
  stockStatus?: 'all' | 'low' | 'out' | 'normal';
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Sales Return Types
// ============================================================================

export type SalesReturnReason =
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'CUSTOMER_CHANGED_MIND'
  | 'DUPLICATE_BILLING'
  | 'PRICE_ADJUSTMENT'
  | 'OTHER';

export type SalesReturnStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface SalesReturnItem {
  id: string;
  salesReturnId: string;
  invoiceItemId: string;
  returnQuantity: number;
  unitPrice: number;
  returnAmount: number;
  reason?: string;
  createdAt: string;
  invoiceItem?: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  };
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  invoiceId: string;
  customerId: string;
  returnStatus: SalesReturnStatus;
  returnReason: SalesReturnReason;
  totalReturnAmount: number;
  refundedAmount: number;
  refundProcessed: boolean;
  paymentMethodId?: string;
  referenceNumber?: string;
  notes?: string;
  returnDate: string;
  branchId: string;
  companyId: string;
  createdById: string;
  processedById?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    paymentStatus: string;
    customer?: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  items: SalesReturnItem[];
  paymentMethod?: {
    id: string;
    name: string;
    code: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  processedBy?: {
    id: string;
    name: string;
    email: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface EligibleInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    salesReturnItems: {
      id: string;
      returnQuantity: number;
    }[];
  }[];
}

export interface CreateSalesReturnData {
  invoiceId: string;
  returnReason: SalesReturnReason;
  notes?: string;
  branchId: string;
  isFullReturn?: boolean;
  items?: {
    invoiceItemId: string;
    returnQuantity: number;
    reason?: string;
  }[];
}

export interface ProcessSalesRefundData {
  paymentMethodId?: string;
  referenceNumber?: string;
  notes?: string;
}
