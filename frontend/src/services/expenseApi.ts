import api from './api';
import {
  PettyCashTransfer,
  CreatePettyCashTransferDto,
  UpdatePettyCashTransferDto,
  PettyCashTransferFilters,
  BranchBalance,
  PettyCashRequest,
  CreatePettyCashRequestDto,
  UpdatePettyCashRequestDto,
  ApprovePettyCashRequestDto,
  RejectPettyCashRequestDto,
  PettyCashRequestFilters,
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilters,
  ExpenseStats,
  BranchExpenseDashboard,
  PaginatedResponse,
} from '../types/expense';

// ==================== Petty Cash Transfer API ====================

export const pettyCashTransferApi = {
  /**
   * Get all petty cash transfers with pagination and filters
   */
  getAll: async (filters?: PettyCashTransferFilters): Promise<PaginatedResponse<PettyCashTransfer>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/petty-cash-transfers?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get transfer by ID
   */
  getById: async (id: string): Promise<PettyCashTransfer> => {
    const response = await api.get(`/petty-cash-transfers/${id}`);
    return response.data.data;
  },

  /**
   * Create a new transfer
   */
  create: async (data: CreatePettyCashTransferDto): Promise<PettyCashTransfer> => {
    const response = await api.post('/petty-cash-transfers', data);
    return response.data.data;
  },

  /**
   * Update transfer
   */
  update: async (id: string, data: UpdatePettyCashTransferDto): Promise<PettyCashTransfer> => {
    const response = await api.put(`/petty-cash-transfers/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete transfer
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/petty-cash-transfers/${id}`);
  },

  /**
   * Get branch balance
   */
  getBranchBalance: async (branchId: string): Promise<BranchBalance> => {
    const response = await api.get(`/petty-cash-transfers/branch/${branchId}/balance`);
    return response.data.data;
  },

  /**
   * Get transfer statistics
   */
  getStats: async (branchId?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get(`/petty-cash-transfers/stats?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get branch transfer history with pagination
   */
  getBranchTransferHistory: async (
    branchId: string,
    filters?: { page?: number; limit?: number; startDate?: string; endDate?: string }
  ): Promise<PaginatedResponse<PettyCashTransfer>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/petty-cash-transfers/branch/${branchId}/history?${params.toString()}`);
    return response.data.data;
  },
};

// ==================== Petty Cash Request API ====================

export const pettyCashRequestApi = {
  /**
   * Get all petty cash requests with pagination and filters
   */
  getAll: async (filters?: PettyCashRequestFilters): Promise<PaginatedResponse<PettyCashRequest>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/petty-cash-requests?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get my requests (current user's branch)
   */
  getMyRequests: async (filters?: PettyCashRequestFilters): Promise<PaginatedResponse<PettyCashRequest>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/petty-cash-requests/my-requests?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get request by ID
   */
  getById: async (id: string): Promise<PettyCashRequest> => {
    const response = await api.get(`/petty-cash-requests/${id}`);
    return response.data.data;
  },

  /**
   * Create a new request
   */
  create: async (data: CreatePettyCashRequestDto): Promise<PettyCashRequest> => {
    const response = await api.post('/petty-cash-requests', data);
    return response.data.data;
  },

  /**
   * Update request (only pending requests)
   */
  update: async (id: string, data: UpdatePettyCashRequestDto): Promise<PettyCashRequest> => {
    const response = await api.put(`/petty-cash-requests/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete request (only pending requests)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/petty-cash-requests/${id}`);
  },

  /**
   * Approve request
   */
  approve: async (id: string, data: ApprovePettyCashRequestDto): Promise<{ request: PettyCashRequest; transfer: PettyCashTransfer }> => {
    const response = await api.post(`/petty-cash-requests/${id}/approve`, data);
    return response.data.data;
  },

  /**
   * Reject request
   */
  reject: async (id: string, data: RejectPettyCashRequestDto): Promise<PettyCashRequest> => {
    const response = await api.post(`/petty-cash-requests/${id}/reject`, data);
    return response.data.data;
  },

  /**
   * Cancel request (by requester)
   */
  cancel: async (id: string): Promise<PettyCashRequest> => {
    const response = await api.post(`/petty-cash-requests/${id}/cancel`);
    return response.data.data;
  },
};

// ==================== Expense API ====================

export const expenseApi = {
  /**
   * Get all expenses with pagination and filters
   */
  getAll: async (filters?: ExpenseFilters): Promise<PaginatedResponse<Expense>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.recordedBy) params.append('recordedBy', filters.recordedBy);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString());
    if (filters?.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString());

    const response = await api.get(`/expenses?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get expense by ID
   */
  getById: async (id: string): Promise<Expense> => {
    const response = await api.get(`/expenses/${id}`);
    return response.data.data;
  },

  /**
   * Create a new expense
   */
  create: async (data: CreateExpenseDto): Promise<Expense> => {
    const response = await api.post('/expenses', data);
    return response.data.data;
  },

  /**
   * Update expense
   */
  update: async (id: string, data: UpdateExpenseDto): Promise<Expense> => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete expense
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  /**
   * Get expense statistics
   */
  getStats: async (branchId?: string, categoryId?: string): Promise<ExpenseStats> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (categoryId) params.append('categoryId', categoryId);

    const response = await api.get(`/expenses/stats?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get branch expense dashboard data
   */
  getBranchDashboard: async (branchId: string): Promise<BranchExpenseDashboard> => {
    const response = await api.get(`/expenses/branch/${branchId}/dashboard`);
    return response.data.data;
  },
};

export default {
  pettyCashTransfer: pettyCashTransferApi,
  pettyCashRequest: pettyCashRequestApi,
  expense: expenseApi,
};
