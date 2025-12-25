import { api } from './api';

// Warranty Types
export interface WarrantyRecord {
  id: string;
  warrantyNumber: string;
  sourceType: 'SERVICE' | 'SALE';
  serviceId?: string;
  servicePartId?: string;
  invoiceId?: string;
  invoiceItemId?: string;
  itemId: string;
  customerId: string;
  warrantyDays: number;
  startDate: string;
  endDate: string;
  isClaimed: boolean;
  claimedAt?: string;
  claimServiceId?: string;
  claimReason?: string;
  companyId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  daysRemaining?: number;
  isExpired?: boolean;
  statusLabel?: 'ACTIVE' | 'EXPIRED' | 'CLAIMED';
  // Relations
  item?: {
    id: string;
    itemName: string;
    itemCode?: string;
  };
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  service?: {
    id: string;
    serviceNumber: string;
    deviceName?: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
  branch?: {
    id: string;
    name: string;
    code?: string;
  };
  claimService?: {
    id: string;
    serviceNumber: string;
  };
}

export interface WarrantyCheckResult {
  hasWarranty: boolean;
  warrantyRecord?: {
    id: string;
    warrantyNumber: string;
    itemId: string;
    itemName: string;
    warrantyDays: number;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    isExpired: boolean;
    isClaimed: boolean;
    sourceType: string;
    serviceId?: string;
    invoiceId?: string;
  };
}

export interface WarrantyStats {
  totalActive: number;
  expiringThisMonth: number;
  claimedThisMonth: number;
  totalExpired: number;
}

export interface WarrantyFilters {
  customerId?: string;
  itemId?: string;
  branchId?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'CLAIMED' | 'ALL';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface WarrantySearchResult {
  warranties: WarrantyRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Warranty Type Options for Item form
export const WARRANTY_TYPE_OPTIONS = [
  { value: 'NONE', label: 'No Warranty', days: 0 },
  { value: '1_MONTH', label: '1 Month', days: 30 },
  { value: '3_MONTHS', label: '3 Months', days: 90 },
  { value: '6_MONTHS', label: '6 Months', days: 180 },
  { value: '1_YEAR', label: '1 Year', days: 365 },
  { value: 'CUSTOM', label: 'Custom', days: null },
];

// API Functions
export const warrantyApi = {
  // Check warranty status for a customer and item
  checkWarranty: async (customerId: string, itemId: string): Promise<WarrantyCheckResult> => {
    const response = await api.get('/warranties/check', {
      params: { customerId, itemId },
    });
    return response.data.data;
  },

  // Get all active warranties for a customer
  getCustomerWarranties: async (customerId: string): Promise<WarrantyRecord[]> => {
    const response = await api.get(`/warranties/customer/${customerId}`);
    return response.data.data;
  },

  // Get warranty by ID
  getWarrantyById: async (id: string): Promise<WarrantyRecord> => {
    const response = await api.get(`/warranties/${id}`);
    return response.data.data;
  },

  // Search warranties with filters
  searchWarranties: async (filters: WarrantyFilters): Promise<WarrantySearchResult> => {
    const response = await api.get('/warranties', { params: filters });
    return response.data.data;
  },

  // Get warranty statistics
  getWarrantyStats: async (branchId?: string): Promise<WarrantyStats> => {
    const response = await api.get('/warranties/stats', {
      params: branchId ? { branchId } : undefined,
    });
    return response.data.data;
  },

  // Get warranties for a service
  getServiceWarranties: async (serviceId: string): Promise<WarrantyRecord[]> => {
    const response = await api.get(`/warranties/service/${serviceId}`);
    return response.data.data;
  },

  // Get warranties for an invoice
  getInvoiceWarranties: async (invoiceId: string): Promise<WarrantyRecord[]> => {
    const response = await api.get(`/warranties/invoice/${invoiceId}`);
    return response.data.data;
  },

  // Mark warranty as claimed
  markWarrantyClaimed: async (
    warrantyId: string,
    claimServiceId: string,
    claimReason: string
  ): Promise<WarrantyRecord> => {
    const response = await api.post(`/warranties/${warrantyId}/claim`, {
      claimServiceId,
      claimReason,
    });
    return response.data.data;
  },

  // Get warranty label for display
  getWarrantyLabel: async (warrantyDays: number, warrantyType?: string): Promise<string> => {
    const response = await api.get('/warranties/label', {
      params: { warrantyDays, warrantyType },
    });
    return response.data.data.label;
  },
};

// Helper functions
export const getWarrantyStatusColor = (status: string): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'EXPIRED':
      return 'bg-gray-100 text-gray-800';
    case 'CLAIMED':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const formatWarrantyDays = (days: number, warrantyType?: string): string => {
  if (!days || days <= 0) return 'No Warranty';

  switch (warrantyType) {
    case '1_MONTH':
      return '1 Month Warranty';
    case '3_MONTHS':
      return '3 Months Warranty';
    case '6_MONTHS':
      return '6 Months Warranty';
    case '1_YEAR':
      return '1 Year Warranty';
    case 'CUSTOM':
      return `${days} Days Warranty`;
    default:
      if (days === 30) return '1 Month Warranty';
      if (days === 90) return '3 Months Warranty';
      if (days === 180) return '6 Months Warranty';
      if (days === 365) return '1 Year Warranty';
      return `${days} Days Warranty`;
  }
};

export const getWarrantyDaysFromType = (warrantyType: string): number => {
  const option = WARRANTY_TYPE_OPTIONS.find((opt) => opt.value === warrantyType);
  return option?.days ?? 0;
};
