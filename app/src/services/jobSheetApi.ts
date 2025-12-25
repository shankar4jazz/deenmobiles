import { api } from './api';

// Job Sheet Types
export interface JobSheet {
  id: string;
  jobSheetNumber: string;
  serviceId: string;
  generatedAt: string;
  generatedBy: string;
  pdfUrl?: string;
  companyId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  service?: {
    id: string;
    ticketNumber: string;
    deviceModel: string;
    deviceIMEI?: string;
    devicePassword?: string;
    issue: string;
    diagnosis?: string;
    estimatedCost: number;
    advancePayment: number;
    customer: {
      id: string;
      name: string;
      phone: string;
      email?: string;
      address?: string;
    };
    customerDevice?: {
      id: string;
      color?: string;
      accessories?: string;
      purchaseYear?: number;
    };
  };
  generatedByUser?: {
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

export interface JobSheetFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface JobSheetListResponse {
  data: JobSheet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Job Sheet API Functions
export const jobSheetApi = {
  // Generate job sheet from service
  generateFromService: async (serviceId: string, templateId?: string): Promise<JobSheet> => {
    const response = await api.post(`/services/${serviceId}/jobsheet`, {
      templateId,
    });
    return response.data.data;
  },

  // Get job sheet by service ID
  getByServiceId: async (serviceId: string): Promise<JobSheet> => {
    const response = await api.get(`/services/${serviceId}/jobsheet`);
    return response.data.data;
  },

  // Get all job sheets with filters
  getAll: async (filters: JobSheetFilters = {}): Promise<JobSheetListResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/jobsheets?${params.toString()}`);
    return response.data.data;
  },

  // Get job sheet by ID
  getById: async (id: string): Promise<JobSheet> => {
    const response = await api.get(`/jobsheets/${id}`);
    return response.data.data;
  },

  // Regenerate job sheet PDF
  regeneratePDF: async (id: string): Promise<JobSheet> => {
    const response = await api.post(`/jobsheets/${id}/regenerate`);
    return response.data.data;
  },

  // Download job sheet PDF
  downloadPDF: async (id: string): Promise<{ pdfUrl: string }> => {
    const response = await api.get(`/jobsheets/${id}/pdf`);
    return response.data.data;
  },
};
