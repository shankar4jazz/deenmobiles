import { api } from './api';

// Job Sheet Template Category API service
export interface JobSheetTemplateCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
  _count?: {
    templates: number;
  };
}

export interface CreateJobSheetTemplateCategoryData {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateJobSheetTemplateCategoryData extends Partial<CreateJobSheetTemplateCategoryData> {}

export interface GetJobSheetTemplateCategoriesParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface JobSheetTemplateCategoriesResponse {
  data: JobSheetTemplateCategory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const jobSheetTemplateCategoryApi = {
  /**
   * Get all job sheet template categories
   */
  getAll: async (params?: GetJobSheetTemplateCategoriesParams): Promise<JobSheetTemplateCategoriesResponse> => {
    const response = await api.get<JobSheetTemplateCategoriesResponse>('/job-sheet-template-categories', { params });
    return response.data;
  },

  /**
   * Get category by ID
   */
  getById: async (id: string): Promise<JobSheetTemplateCategory> => {
    const response = await api.get<JobSheetTemplateCategory>(`/job-sheet-template-categories/${id}`);
    return response.data;
  },

  /**
   * Create new category
   */
  create: async (data: CreateJobSheetTemplateCategoryData): Promise<JobSheetTemplateCategory> => {
    const response = await api.post<JobSheetTemplateCategory>('/job-sheet-template-categories', data);
    return response.data;
  },

  /**
   * Update category
   */
  update: async (id: string, data: UpdateJobSheetTemplateCategoryData): Promise<JobSheetTemplateCategory> => {
    const response = await api.put<JobSheetTemplateCategory>(`/job-sheet-template-categories/${id}`, data);
    return response.data;
  },

  /**
   * Delete category
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/job-sheet-template-categories/${id}`);
    return response.data;
  },

  /**
   * Toggle category active status
   */
  toggleStatus: async (id: string): Promise<JobSheetTemplateCategory> => {
    const response = await api.patch<JobSheetTemplateCategory>(`/job-sheet-template-categories/${id}/toggle-status`);
    return response.data;
  },
};
