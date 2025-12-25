import { api } from './api';
import { Customer, CustomerFormData, CustomerUpdateData, CustomerFilters } from '../types';

export const customerApi = {
  /**
   * Create a new customer
   */
  createCustomer: async (data: CustomerFormData): Promise<Customer> => {
    // If idProofDocument is a File, use FormData
    if (data.idProofDocument instanceof File) {
      const formData = new FormData();

      // Append all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await api.post('/customers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    }

    // Otherwise, use regular JSON
    const response = await api.post('/customers', data);
    return response.data.data;
  },

  /**
   * Get all customers with filters and pagination
   */
  getAllCustomers: async (
    filters?: CustomerFilters
  ): Promise<{
    customers: Customer[];
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
    if (filters?.search) params.append('search', filters.search);
    if (filters?.branchId) params.append('branchId', filters.branchId);

    const response = await api.get(`/customers?${params.toString()}`);
    return {
      customers: response.data.data,
      pagination: response.data.pagination,
    };
  },

  /**
   * Get customer by ID
   */
  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data.data;
  },

  /**
   * Update customer
   */
  updateCustomer: async (
    id: string,
    data: CustomerUpdateData
  ): Promise<Customer> => {
    // If idProofDocument is a File or explicitly null, use FormData
    if (data.idProofDocument instanceof File || data.removeIdProof) {
      const formData = new FormData();

      // Append all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'removeIdProof' && value === true) {
          formData.append('removeIdProof', 'true');
        } else if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await api.put(`/customers/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    }

    // Otherwise, use regular JSON
    const response = await api.put(`/customers/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete customer
   */
  deleteCustomer: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  /**
   * Check if phone number is available
   */
  checkPhoneAvailability: async (
    phone: string,
    customerId?: string
  ): Promise<{ available: boolean }> => {
    const params = new URLSearchParams();
    params.append('phone', phone);
    if (customerId) params.append('customerId', customerId);

    const response = await api.get(`/customers/check-phone?${params.toString()}`);
    return response.data;
  },

  /**
   * Get customer statistics
   */
  getCustomerStats: async (branchId?: string): Promise<{
    totalCustomers: number;
    customersWithServices: number;
    recentCustomers: number;
  }> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get(`/customers/stats?${params.toString()}`);
    return response.data.data;
  },
};
