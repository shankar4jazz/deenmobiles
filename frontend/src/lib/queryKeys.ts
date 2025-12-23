/**
 * Query Key Factory for TanStack Query
 * Provides consistent, hierarchical query keys for caching and invalidation
 */

// Service-related query keys
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...serviceKeys.lists(), filters] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
  history: (id: string) => [...serviceKeys.detail(id), 'history'] as const,
  notes: (id: string) => [...serviceKeys.detail(id), 'notes'] as const,
  warranties: (id: string) => [...serviceKeys.detail(id), 'warranties'] as const,
  parts: (id: string) => [...serviceKeys.detail(id), 'parts'] as const,
  availableParts: (id: string, branchId: string) => [...serviceKeys.detail(id), 'available-parts', branchId] as const,
  jobSheet: (id: string) => [...serviceKeys.detail(id), 'jobsheet'] as const,
  invoice: (id: string) => [...serviceKeys.detail(id), 'invoice'] as const,
  previousCheck: (deviceId: string) => [...serviceKeys.all, 'previous-check', deviceId] as const,
};

// Technician-related query keys
export const technicianKeys = {
  all: ['technicians'] as const,
  lists: () => [...technicianKeys.all, 'list'] as const,
  forAssignment: (branchId: string, categoryId?: string) =>
    [...technicianKeys.all, 'assignment', branchId, categoryId ?? 'all'] as const,
  profile: (id: string) => [...technicianKeys.all, 'profile', id] as const,
  dashboard: (userId: string) => [...technicianKeys.all, 'dashboard', userId] as const,
};

// Customer-related query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...customerKeys.lists(), filters] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
  devices: (id: string) => [...customerKeys.detail(id), 'devices'] as const,
  warranties: (id: string) => [...customerKeys.detail(id), 'warranties'] as const,
};

// Inventory-related query keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  branchItems: (branchId: string) => [...inventoryKeys.all, 'branch', branchId] as const,
  item: (id: string) => [...inventoryKeys.all, 'item', id] as const,
};

// Master data query keys
export const masterDataKeys = {
  all: ['master-data'] as const,
  faults: (companyId?: string) => [...masterDataKeys.all, 'faults', companyId ?? 'all'] as const,
  accessories: () => [...masterDataKeys.all, 'accessories'] as const,
  damageConditions: (companyId?: string) => [...masterDataKeys.all, 'damage-conditions', companyId ?? 'all'] as const,
  brands: (companyId?: string) => [...masterDataKeys.all, 'brands', companyId ?? 'all'] as const,
  models: (brandId: string) => [...masterDataKeys.all, 'models', brandId] as const,
  paymentMethods: (companyId?: string) => [...masterDataKeys.all, 'payment-methods', companyId ?? 'all'] as const,
};

// Task-related query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
  myTasks: (userId: string, status?: string) => [...taskKeys.all, 'my-tasks', userId, status ?? 'all'] as const,
  stats: (branchId?: string) => [...taskKeys.all, 'stats', branchId ?? 'all'] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

// Dashboard query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: (branchId: string) => [...dashboardKeys.all, 'data', branchId] as const,
  stats: (branchId: string) => [...dashboardKeys.all, 'stats', branchId] as const,
};

// Cash settlement query keys
export const cashSettlementKeys = {
  all: ['cash-settlements'] as const,
  today: (branchId: string) => [...cashSettlementKeys.all, 'today', branchId] as const,
  list: (filters: Record<string, unknown>) => [...cashSettlementKeys.all, 'list', filters] as const,
  detail: (id: string) => [...cashSettlementKeys.all, 'detail', id] as const,
};

// Job sheet query keys
export const jobSheetKeys = {
  all: ['jobsheets'] as const,
  lists: () => [...jobSheetKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...jobSheetKeys.lists(), filters] as const,
  details: () => [...jobSheetKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobSheetKeys.details(), id] as const,
  byService: (serviceId: string) => [...jobSheetKeys.all, 'service', serviceId] as const,
};

// Invoice query keys
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  byService: (serviceId: string) => [...invoiceKeys.all, 'service', serviceId] as const,
};

// Estimate query keys
export const estimateKeys = {
  all: ['estimates'] as const,
  lists: () => [...estimateKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...estimateKeys.lists(), filters] as const,
  details: () => [...estimateKeys.all, 'detail'] as const,
  detail: (id: string) => [...estimateKeys.details(), id] as const,
};

// Warranty query keys
export const warrantyKeys = {
  all: ['warranties'] as const,
  lists: () => [...warrantyKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...warrantyKeys.lists(), filters] as const,
  details: () => [...warrantyKeys.all, 'detail'] as const,
  detail: (id: string) => [...warrantyKeys.details(), id] as const,
  byCustomer: (customerId: string) => [...warrantyKeys.all, 'customer', customerId] as const,
  byService: (serviceId: string) => [...warrantyKeys.all, 'service', serviceId] as const,
  stats: () => [...warrantyKeys.all, 'stats'] as const,
};

// Branch inventory query keys
export const branchInventoryKeys = {
  all: ['branch-inventory'] as const,
  lists: () => [...branchInventoryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...branchInventoryKeys.lists(), filters] as const,
  details: () => [...branchInventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchInventoryKeys.details(), id] as const,
  movements: (id: string) => [...branchInventoryKeys.detail(id), 'movements'] as const,
  dropdown: (branchId: string) => [...branchInventoryKeys.all, 'dropdown', branchId] as const,
  lowStock: (branchId?: string) => [...branchInventoryKeys.all, 'low-stock', branchId ?? 'all'] as const,
};

// Customer device query keys
export const customerDeviceKeys = {
  all: ['customer-devices'] as const,
  lists: () => [...customerDeviceKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...customerDeviceKeys.lists(), filters] as const,
  byCustomer: (customerId: string) => [...customerDeviceKeys.all, 'customer', customerId] as const,
  details: () => [...customerDeviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerDeviceKeys.details(), id] as const,
  history: (id: string) => [...customerDeviceKeys.detail(id), 'history'] as const,
};

// Expense query keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  stats: (branchId?: string) => [...expenseKeys.all, 'stats', branchId ?? 'all'] as const,
  dashboard: (branchId: string) => [...expenseKeys.all, 'dashboard', branchId] as const,
  analytics: (branchId: string, dateRange?: string) => [...expenseKeys.all, 'analytics', branchId, dateRange ?? 'default'] as const,
};

// Petty cash query keys
export const pettyCashKeys = {
  all: ['petty-cash'] as const,
  requests: () => [...pettyCashKeys.all, 'requests'] as const,
  requestList: (filters: Record<string, unknown>) => [...pettyCashKeys.requests(), filters] as const,
  myRequests: (userId: string) => [...pettyCashKeys.all, 'my-requests', userId] as const,
  transfers: () => [...pettyCashKeys.all, 'transfers'] as const,
  transferList: (filters: Record<string, unknown>) => [...pettyCashKeys.transfers(), filters] as const,
  balance: (branchId: string) => [...pettyCashKeys.all, 'balance', branchId] as const,
  dashboard: (branchId: string) => [...pettyCashKeys.all, 'dashboard', branchId] as const,
};

// Items query keys
export const itemsKeys = {
  all: ['items'] as const,
  lists: () => [...itemsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...itemsKeys.lists(), filters] as const,
  details: () => [...itemsKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemsKeys.details(), id] as const,
  dropdown: () => [...itemsKeys.all, 'dropdown'] as const,
};

// Supplier query keys
export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...supplierKeys.lists(), filters] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
  dropdown: () => [...supplierKeys.all, 'dropdown'] as const,
};

// Purchase order query keys
export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...purchaseOrderKeys.lists(), filters] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseOrderKeys.details(), id] as const,
  returns: (orderId: string) => [...purchaseOrderKeys.detail(orderId), 'returns'] as const,
};

// Role query keys
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...roleKeys.lists(), filters] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
};

// Branch query keys
export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...branchKeys.lists(), filters] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
  employees: (branchId: string) => [...branchKeys.detail(branchId), 'employees'] as const,
  analytics: (branchId: string) => [...branchKeys.detail(branchId), 'analytics'] as const,
};

// Employee query keys
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

// Theme query keys
export const themeKeys = {
  all: ['themes'] as const,
  lists: () => [...themeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...themeKeys.lists(), filters] as const,
  details: () => [...themeKeys.all, 'detail'] as const,
  detail: (id: string) => [...themeKeys.details(), id] as const,
};
