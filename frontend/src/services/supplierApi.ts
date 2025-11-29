import { api } from './api';
import { Supplier, SupplierFormData, SupplierFilters } from '../types';

export const supplierApi = {
  /**
   * Create a new supplier
   */
  createSupplier: async (data: SupplierFormData): Promise<Supplier> => {
    const response = await api.post('/suppliers', data);
    return response.data.data;
  },

  /**
   * Get all suppliers with filters and pagination
   */
  getAllSuppliers: async (
    filters?: SupplierFilters
  ): Promise<{
    suppliers: Supplier[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.active !== undefined)
      params.append('active', filters.active.toString());

    const response = await api.get(`/suppliers?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get active suppliers for dropdown
   */
  getSuppliersDropdown: async (branchId?: string): Promise<
    Array<{ id: string; name: string; supplierCode: string; phone: string }>
  > => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get(`/suppliers/dropdown?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get supplier by ID
   */
  getSupplierById: async (id: string): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data.data;
  },

  /**
   * Update supplier
   */
  updateSupplier: async (
    id: string,
    data: Partial<SupplierFormData>
  ): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete supplier
   */
  deleteSupplier: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },
};
