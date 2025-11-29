import { api } from './api';

// Estimate Types
export interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  serviceId?: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CONVERTED' | 'EXPIRED';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  pdfUrl?: string;
  companyId: string;
  branchId: string;
  createdBy?: string;
  sentAt?: string;
  approvedAt?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  service?: {
    id: string;
    ticketNumber: string;
    deviceModel: string;
    issue: string;
  };
  items?: EstimateItem[];
  convertedInvoice?: {
    id: string;
    invoiceNumber: string;
    createdAt: string;
  };
  _count?: {
    items: number;
  };
}

export interface EstimateItem {
  id: string;
  estimateId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
}

export interface CreateEstimateData {
  customerId: string;
  serviceId?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  validUntil?: string;
  notes?: string;
}

export interface UpdateEstimateData {
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  validUntil?: string;
  notes?: string;
}

export interface EstimateFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  status?: string;
  customerId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface EstimateListResponse {
  data: Estimate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Estimate API Functions
export const estimateApi = {
  // Create new estimate
  create: async (data: CreateEstimateData): Promise<Estimate> => {
    const response = await api.post('/estimates', data);
    return response.data.data;
  },

  // Get all estimates with filters
  getAll: async (filters: EstimateFilters = {}): Promise<EstimateListResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.status) params.append('status', filters.status);
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/estimates?${params.toString()}`);
    return response.data.data;
  },

  // Get estimate by ID
  getById: async (id: string): Promise<Estimate> => {
    const response = await api.get(`/estimates/${id}`);
    return response.data.data;
  },

  // Update estimate
  update: async (id: string, data: UpdateEstimateData): Promise<Estimate> => {
    const response = await api.put(`/estimates/${id}`, data);
    return response.data.data;
  },

  // Delete estimate
  delete: async (id: string): Promise<void> => {
    await api.delete(`/estimates/${id}`);
  },

  // Update estimate status
  updateStatus: async (id: string, status: string): Promise<Estimate> => {
    const response = await api.put(`/estimates/${id}/status`, { status });
    return response.data.data;
  },

  // Send estimate to customer
  sendEstimate: async (id: string, email: string): Promise<Estimate> => {
    const response = await api.post(`/estimates/${id}/send`, { email });
    return response.data.data;
  },

  // Approve estimate
  approve: async (id: string): Promise<Estimate> => {
    const response = await api.post(`/estimates/${id}/approve`);
    return response.data.data;
  },

  // Reject estimate
  reject: async (id: string): Promise<Estimate> => {
    const response = await api.post(`/estimates/${id}/reject`);
    return response.data.data;
  },

  // Convert estimate to invoice
  convertToInvoice: async (id: string): Promise<any> => {
    const response = await api.post(`/estimates/${id}/convert`);
    return response.data.data;
  },

  // Get estimate PDF URL
  getPDF: async (id: string, format: string = 'A4'): Promise<{ pdfUrl: string }> => {
    const response = await api.get(`/estimates/${id}/pdf?format=${format}`);
    return response.data.data;
  },

  // Regenerate estimate PDF
  regeneratePDF: async (id: string): Promise<Estimate> => {
    const response = await api.post(`/estimates/${id}/regenerate-pdf`);
    return response.data.data;
  },
};
