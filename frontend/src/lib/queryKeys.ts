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
