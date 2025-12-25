import { api } from './api';
import { Branch, BranchFormData, BranchFilters } from '../types';

export const branchApi = {
  /**
   * Create a new branch
   */
  createBranch: async (data: BranchFormData): Promise<Branch> => {
    const response = await api.post('/branches', data);
    return response.data.data;
  },

  /**
   * Get all branches with filters and pagination
   */
  getAllBranches: async (
    filters?: BranchFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    branches: Branch[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());
    if (filters?.managerId) params.append('managerId', filters.managerId);

    const response = await api.get(`/branches?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get branch by ID
   */
  getBranchById: async (id: string): Promise<Branch> => {
    const response = await api.get(`/branches/${id}`);
    return response.data.data;
  },

  /**
   * Update branch
   */
  updateBranch: async (
    id: string,
    data: Partial<BranchFormData>
  ): Promise<Branch> => {
    const response = await api.put(`/branches/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete branch
   */
  deleteBranch: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/branches/${id}`);
    return response.data.data;
  },

  /**
   * Get simplified list of branches for dropdowns
   */
  getBranchList: async (): Promise<
    Array<{ id: string; name: string; code: string }>
  > => {
    const response = await api.get('/branches/list/simple');
    return response.data.data;
  },

  /**
   * Get available managers for branch assignment
   */
  getAvailableManagers: async (): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>
  > => {
    const response = await api.get('/branches/managers/available');
    return response.data.data;
  },

  /**
   * Get all employees for a specific branch
   */
  getBranchEmployees: async (branchId: string): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      isActive: boolean;
      createdAt: string;
    }>
  > => {
    const response = await api.get(`/branches/${branchId}/employees`);
    return response.data.data;
  },
};
