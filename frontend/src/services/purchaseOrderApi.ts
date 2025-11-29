import { api } from './api';
import {
  PurchaseOrder,
  PurchaseOrderFormData,
  PurchaseOrderFilters,
  ReceiveItemsData,
  SupplierOutstanding,
  PurchaseOrderStatus,
} from '../types';

export const purchaseOrderApi = {
  /**
   * Create a new purchase order
   */
  createPurchaseOrder: async (
    data: PurchaseOrderFormData
  ): Promise<PurchaseOrder> => {
    const response = await api.post('/purchase-orders', data);
    return response.data.data;
  },

  /**
   * Get all purchase orders with filters and pagination
   */
  getAllPurchaseOrders: async (
    filters?: PurchaseOrderFilters
  ): Promise<{
    purchaseOrders: PurchaseOrder[];
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
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/purchase-orders?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get purchase order by ID
   */
  getPurchaseOrderById: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data.data;
  },

  /**
   * Update purchase order
   */
  updatePurchaseOrder: async (
    id: string,
    data: Partial<PurchaseOrderFormData>
  ): Promise<PurchaseOrder> => {
    const response = await api.put(`/purchase-orders/${id}`, data);
    return response.data.data;
  },

  /**
   * Receive items for a purchase order
   */
  receiveItems: async (
    id: string,
    data: ReceiveItemsData
  ): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/receive`, data);
    return response.data.data;
  },

  /**
   * Update purchase order status
   */
  updateStatus: async (
    id: string,
    status: PurchaseOrderStatus,
    notes?: string
  ): Promise<PurchaseOrder> => {
    const response = await api.patch(`/purchase-orders/${id}/status`, {
      status,
      notes,
    });
    return response.data.data;
  },

  /**
   * Delete purchase order
   */
  deletePurchaseOrder: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/purchase-orders/${id}`);
    return response.data;
  },

  /**
   * Get supplier outstanding balance
   */
  getSupplierOutstanding: async (
    supplierId: string,
    branchId?: string
  ): Promise<SupplierOutstanding> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get(
      `/purchase-orders/supplier/${supplierId}/outstanding?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Get purchase order summary statistics
   */
  getPurchaseOrderSummary: async (
    branchId?: string
  ): Promise<{
    totalCount: number;
    totalAmount: number;
    totalPaid: number;
    pendingAmount: number;
  }> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get(`/purchase-orders/summary?${params.toString()}`);
    return response.data.data;
  },
};
