import { api } from './api';
import {
  SalesReturn,
  EligibleInvoice,
  CreateSalesReturnData,
  ProcessSalesRefundData,
} from '../types';

const BASE_URL = '/sales-returns';

export const salesReturnApi = {
  /**
   * Get all sales returns
   */
  getAllReturns: async (branchId?: string): Promise<SalesReturn[]> => {
    const params = branchId ? { branchId } : {};
    const response = await api.get(BASE_URL, { params });
    return response.data.data;
  },

  /**
   * Get eligible invoices for return
   */
  getEligibleInvoices: async (branchId?: string, search?: string): Promise<EligibleInvoice[]> => {
    const params: Record<string, string> = {};
    if (branchId) params.branchId = branchId;
    if (search) params.search = search;
    const response = await api.get(`${BASE_URL}/eligible-invoices`, { params });
    return response.data.data;
  },

  /**
   * Create a new sales return
   */
  createReturn: async (data: CreateSalesReturnData): Promise<SalesReturn> => {
    const response = await api.post(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Get sales return by ID
   */
  getReturnById: async (id: string, branchId?: string): Promise<SalesReturn> => {
    const params = branchId ? { branchId } : {};
    const response = await api.get(`${BASE_URL}/${id}`, { params });
    return response.data.data;
  },

  /**
   * Get all returns for an invoice
   */
  getReturnsByInvoice: async (invoiceId: string): Promise<SalesReturn[]> => {
    const response = await api.get(`${BASE_URL}/invoice/${invoiceId}`);
    return response.data.data;
  },

  /**
   * Confirm a sales return
   */
  confirmReturn: async (id: string, branchId?: string): Promise<SalesReturn> => {
    const params = branchId ? { branchId } : {};
    const response = await api.put(`${BASE_URL}/${id}/confirm`, {}, { params });
    return response.data.data;
  },

  /**
   * Reject a sales return
   */
  rejectReturn: async (id: string, reason?: string, branchId?: string): Promise<SalesReturn> => {
    const params = branchId ? { branchId } : {};
    const response = await api.put(`${BASE_URL}/${id}/reject`, { reason }, { params });
    return response.data.data;
  },

  /**
   * Process refund for a confirmed return
   */
  processRefund: async (
    id: string,
    data: ProcessSalesRefundData,
    branchId?: string
  ): Promise<SalesReturn> => {
    const params = branchId ? { branchId } : {};
    const response = await api.post(`${BASE_URL}/${id}/refund`, data, { params });
    return response.data.data;
  },
};
