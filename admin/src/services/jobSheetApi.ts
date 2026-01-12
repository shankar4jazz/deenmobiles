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

// Job Sheet Format Types
export type JobSheetFormat = 'A4' | 'A5' | 'A5-V2' | 'thermal';

// Job Sheet Copy Types
export type JobSheetCopyType = 'customer' | 'office';

// Job Sheet API Functions
export const jobSheetApi = {
  // Generate job sheet from service with format and copy type support
  generateFromService: async (
    serviceId: string,
    templateId?: string,
    format: JobSheetFormat = 'A5-V2',
    copyType: JobSheetCopyType = 'customer'
  ): Promise<JobSheet> => {
    const response = await api.post(`/services/${serviceId}/jobsheet`, {
      templateId,
      format,
      copyType,
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

  // Regenerate job sheet PDF with format and copy type support
  regeneratePDF: async (
    id: string,
    format: JobSheetFormat = 'A5-V2',
    copyType: JobSheetCopyType = 'customer'
  ): Promise<JobSheet> => {
    const response = await api.post(`/jobsheets/${id}/regenerate`, { format, copyType });
    return response.data.data;
  },

  // Download job sheet PDF (legacy - returns URL from storage)
  downloadPDF: async (id: string): Promise<{ pdfUrl: string }> => {
    const response = await api.get(`/jobsheets/${id}/pdf`);
    return response.data.data;
  },

  // Stream job sheet PDF on-demand (no file saved) - for viewing
  // Returns a blob URL that can be used to display the PDF
  streamPDF: async (
    serviceId: string,
    format: JobSheetFormat = 'A5-V2',
    copyType: JobSheetCopyType = 'customer'
  ): Promise<string> => {
    const response = await api.get(
      `/services/${serviceId}/jobsheet/stream?format=${format}&copyType=${copyType}`,
      { responseType: 'blob' }
    );
    // Create a blob URL for the PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  },

  // Download job sheet PDF on-demand (no file saved) - for downloading
  downloadPDFOnDemand: async (
    serviceId: string,
    format: JobSheetFormat = 'A5-V2',
    copyType: JobSheetCopyType = 'customer'
  ): Promise<void> => {
    const response = await api.get(
      `/services/${serviceId}/jobsheet/download?format=${format}&copyType=${copyType}`,
      { responseType: 'blob' }
    );
    // Create a download link
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jobsheet_${serviceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Get shareable job sheet URL (for WhatsApp sharing)
  // This saves the PDF to storage and returns a shareable URL
  getShareableURL: async (
    serviceId: string,
    format: JobSheetFormat = 'A5-V2',
    copyType: JobSheetCopyType = 'customer'
  ): Promise<{ pdfUrl: string; jobSheetNumber: string }> => {
    const response = await api.post(`/services/${serviceId}/jobsheet/share`, {
      format,
      copyType,
    });
    return response.data.data;
  },
};
