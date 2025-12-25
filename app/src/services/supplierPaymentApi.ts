import { api } from './api';
import {
  SupplierPayment,
  SupplierPaymentFormData,
  SupplierPaymentFilters,
  SupplierPaymentSummary,
} from '../types';

export const supplierPaymentApi = {
  /**
   * Create a new supplier payment
   */
  createSupplierPayment: async (
    data: SupplierPaymentFormData
  ): Promise<SupplierPayment> => {
    const response = await api.post('/supplier-payments', data);
    return response.data.data;
  },

  /**
   * Get all supplier payments with filters and pagination
   */
  getAllSupplierPayments: async (
    filters?: SupplierPaymentFilters
  ): Promise<{
    payments: SupplierPayment[];
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
    if (filters?.supplierId) params.append('supplierId', filters.supplierId);
    if (filters?.purchaseOrderId)
      params.append('purchaseOrderId', filters.purchaseOrderId);
    if (filters?.paymentMethod)
      params.append('paymentMethod', filters.paymentMethod);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/supplier-payments?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get supplier payment by ID
   */
  getSupplierPaymentById: async (id: string): Promise<SupplierPayment> => {
    const response = await api.get(`/supplier-payments/${id}`);
    return response.data.data;
  },

  /**
   * Get supplier payment summary
   */
  getSupplierPaymentSummary: async (
    supplierId: string,
    branchId?: string
  ): Promise<SupplierPaymentSummary> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get(
      `/supplier-payments/supplier/${supplierId}/summary?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Update supplier payment
   */
  updateSupplierPayment: async (
    id: string,
    data: Partial<SupplierPaymentFormData>
  ): Promise<SupplierPayment> => {
    const response = await api.put(`/supplier-payments/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete supplier payment
   */
  deleteSupplierPayment: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/supplier-payments/${id}`);
    return response.data;
  },
};
