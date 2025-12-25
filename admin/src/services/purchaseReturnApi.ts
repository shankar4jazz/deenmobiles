import { api } from './api';
import { PurchaseItemReturn, CreatePurchaseReturnData } from '../types';

const BASE_URL = '/purchase-returns';

export const purchaseReturnApi = {
  /**
   * Get all returns
   */
  getAllReturns: async (branchId?: string): Promise<PurchaseItemReturn[]> => {
    const params = branchId ? { branchId } : {};
    const response = await api.get(BASE_URL, { params });
    return response.data.data;
  },

  /**
   * Create a new purchase return
   */
  createReturn: async (data: CreatePurchaseReturnData): Promise<PurchaseItemReturn> => {
    const response = await api.post(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Get return by ID
   */
  getReturnById: async (id: string, branchId?: string): Promise<PurchaseItemReturn> => {
    const params = branchId ? { branchId } : {};
    const response = await api.get(`${BASE_URL}/${id}`, { params });
    return response.data.data;
  },

  /**
   * Get all returns for a purchase order
   */
  getReturnsByPO: async (poId: string): Promise<PurchaseItemReturn[]> => {
    const response = await api.get(`${BASE_URL}/purchase-order/${poId}`);
    return response.data.data;
  },

  /**
   * Confirm a purchase return
   */
  confirmReturn: async (id: string, branchId?: string): Promise<PurchaseItemReturn> => {
    const params = branchId ? { branchId } : {};
    const response = await api.put(`${BASE_URL}/${id}/confirm`, {}, { params });
    return response.data.data;
  },

  /**
   * Reject a purchase return
   */
  rejectReturn: async (id: string, reason?: string, branchId?: string): Promise<PurchaseItemReturn> => {
    const params = branchId ? { branchId } : {};
    const response = await api.put(`${BASE_URL}/${id}/reject`, { reason }, { params });
    return response.data.data;
  },

  /**
   * Process refund for a confirmed return
   */
  processRefund: async (
    id: string,
    data: {
      paymentMethodId?: string;
      referenceNumber?: string;
      notes?: string;
    },
    branchId?: string
  ): Promise<any> => {
    const params = branchId ? { branchId } : {};
    const response = await api.post(`${BASE_URL}/${id}/process-refund`, data, { params });
    return response.data.data;
  },
};
