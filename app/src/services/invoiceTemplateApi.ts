import { api } from './api';

// Invoice Template Types
export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  taxRate: number;
  isActive: boolean;
  companyId: string;
  branchId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  createdByUser?: {
    id: string;
    name: string;
  };
  items: InvoiceTemplateItem[];
  _count?: {
    items: number;
  };
}

export interface InvoiceTemplateItem {
  id: string;
  templateId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
  createdAt: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  notes?: string;
  taxRate?: number;
  branchId?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    sortOrder?: number;
  }>;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  notes?: string;
  taxRate?: number;
  isActive?: boolean;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    sortOrder?: number;
  }>;
}

export interface TemplateFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  isActive?: boolean;
  search?: string;
}

export interface TemplateListResponse {
  templates: InvoiceTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Invoice Template API Functions
export const invoiceTemplateApi = {
  // Create new template
  create: async (data: CreateTemplateData): Promise<InvoiceTemplate> => {
    const response = await api.post('/invoice-templates', data);
    return response.data.data;
  },

  // Get all templates with filters
  getAll: async (filters: TemplateFilters = {}): Promise<TemplateListResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/invoice-templates?${params.toString()}`);
    return response.data.data;
  },

  // Get template by ID
  getById: async (id: string): Promise<InvoiceTemplate> => {
    const response = await api.get(`/invoice-templates/${id}`);
    return response.data.data;
  },

  // Update template
  update: async (id: string, data: UpdateTemplateData): Promise<InvoiceTemplate> => {
    const response = await api.put(`/invoice-templates/${id}`, data);
    return response.data.data;
  },

  // Delete template
  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoice-templates/${id}`);
  },

  // Toggle template status
  toggleStatus: async (id: string): Promise<InvoiceTemplate> => {
    const response = await api.patch(`/invoice-templates/${id}/toggle-status`);
    return response.data.data;
  },
};
