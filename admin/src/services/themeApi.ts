import { api } from './api';

// Theme API service
export interface Theme {
  id: string;
  name: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  fontFamily: string;
  fontSize: number;
  logoUrl?: string;
  showBranchInfo: boolean;
  showTermsAndConditions: boolean;
  termsAndConditions?: string;
  footerText?: string;
  isDefault: boolean;
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
  company?: {
    id: string;
    name: string;
  };
  createdByUser: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface CreateThemeData {
  name: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  fontFamily?: string;
  fontSize?: number;
  logoUrl?: string;
  showBranchInfo?: boolean;
  showTermsAndConditions?: boolean;
  termsAndConditions?: string;
  footerText?: string;
  isDefault?: boolean;
  isActive?: boolean;
  branchId?: string;
}

export interface UpdateThemeData extends Partial<CreateThemeData> {}

export interface GetThemesParams {
  page?: number;
  limit?: number;
  branchId?: string;
  isActive?: boolean;
  isDefault?: boolean;
  search?: string;
}

export interface ThemesResponse {
  data: Theme[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const themeApi = {
  /**
   * Get all themes
   */
  getAll: async (params?: GetThemesParams): Promise<ThemesResponse> => {
    const response = await api.get<ThemesResponse>('/themes', { params });
    return response.data;
  },

  /**
   * Get theme by ID
   */
  getById: async (id: string): Promise<Theme> => {
    const response = await api.get<Theme>(`/themes/${id}`);
    return response.data;
  },

  /**
   * Get default theme
   */
  getDefault: async (branchId?: string): Promise<Theme> => {
    const response = await api.get<Theme>('/themes/default', {
      params: branchId ? { branchId } : undefined,
    });
    return response.data;
  },

  /**
   * Create new theme
   */
  create: async (data: CreateThemeData): Promise<Theme> => {
    const response = await api.post<Theme>('/themes', data);
    return response.data;
  },

  /**
   * Update theme
   */
  update: async (id: string, data: UpdateThemeData): Promise<Theme> => {
    const response = await api.put<Theme>(`/themes/${id}`, data);
    return response.data;
  },

  /**
   * Delete theme
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/themes/${id}`);
    return response.data;
  },

  /**
   * Toggle theme active status
   */
  toggleStatus: async (id: string): Promise<Theme> => {
    const response = await api.patch<Theme>(`/themes/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Set theme as default
   */
  setAsDefault: async (id: string): Promise<Theme> => {
    const response = await api.patch<Theme>(`/themes/${id}/set-default`);
    return response.data;
  },
};
