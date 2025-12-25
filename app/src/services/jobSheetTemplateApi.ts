import { api } from './api';

// Job Sheet Template API service
export interface JobSheetTemplate {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  termsAndConditions?: string;
  showCustomerSignature: boolean;
  showAuthorizedSignature: boolean;
  showCompanyLogo: boolean;
  showContactDetails: boolean;
  footerText?: string;
  isDefault: boolean;
  isActive: boolean;
  companyId: string;
  branchId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  company?: {
    id: string;
    name: string;
  };
  createdByUser: {
    id: string;
    name: string;
    email?: string;
  };
  _count?: {
    jobSheets: number;
  };
}

export interface CreateJobSheetTemplateData {
  name: string;
  description?: string;
  categoryId?: string;
  termsAndConditions?: string;
  showCustomerSignature?: boolean;
  showAuthorizedSignature?: boolean;
  showCompanyLogo?: boolean;
  showContactDetails?: boolean;
  footerText?: string;
  isDefault?: boolean;
  isActive?: boolean;
  branchId?: string;
}

export interface UpdateJobSheetTemplateData extends Partial<CreateJobSheetTemplateData> {}

export interface GetJobSheetTemplatesParams {
  page?: number;
  limit?: number;
  branchId?: string;
  categoryId?: string;
  isActive?: boolean;
  isDefault?: boolean;
  search?: string;
}

export interface JobSheetTemplatesResponse {
  data: JobSheetTemplate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const jobSheetTemplateApi = {
  /**
   * Get all job sheet templates
   */
  getAll: async (params?: GetJobSheetTemplatesParams): Promise<JobSheetTemplatesResponse> => {
    const response = await api.get<JobSheetTemplatesResponse>('/job-sheet-templates', { params });
    return response.data;
  },

  /**
   * Get template by ID
   */
  getById: async (id: string): Promise<JobSheetTemplate> => {
    const response = await api.get<JobSheetTemplate>(`/job-sheet-templates/${id}`);
    return response.data;
  },

  /**
   * Get default template
   */
  getDefault: async (branchId?: string): Promise<JobSheetTemplate> => {
    const response = await api.get<JobSheetTemplate>('/job-sheet-templates/default', {
      params: branchId ? { branchId } : undefined,
    });
    return response.data;
  },

  /**
   * Create new template
   */
  create: async (data: CreateJobSheetTemplateData): Promise<JobSheetTemplate> => {
    const response = await api.post<JobSheetTemplate>('/job-sheet-templates', data);
    return response.data;
  },

  /**
   * Update template
   */
  update: async (id: string, data: UpdateJobSheetTemplateData): Promise<JobSheetTemplate> => {
    const response = await api.put<JobSheetTemplate>(`/job-sheet-templates/${id}`, data);
    return response.data;
  },

  /**
   * Delete template
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/job-sheet-templates/${id}`);
    return response.data;
  },

  /**
   * Toggle template active status
   */
  toggleStatus: async (id: string): Promise<JobSheetTemplate> => {
    const response = await api.patch<JobSheetTemplate>(`/job-sheet-templates/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Set template as default
   */
  setAsDefault: async (id: string): Promise<JobSheetTemplate> => {
    const response = await api.patch<JobSheetTemplate>(`/job-sheet-templates/${id}/set-default`);
    return response.data;
  },
};
