import api from './api';

// ==================== Types ====================

export type CashSettlementStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface CashDenomination {
  id: string;
  cashSettlementId: string;
  note2000Count: number;
  note500Count: number;
  note200Count: number;
  note100Count: number;
  note50Count: number;
  note20Count: number;
  note10Count: number;
  coin5Count: number;
  coin2Count: number;
  coin1Count: number;
  totalAmount: number;
}

export interface CashSettlementMethod {
  id: string;
  cashSettlementId: string;
  paymentMethodId: string;
  paymentMethod: {
    id: string;
    name: string;
    code: string;
  };
  openingBalance: number;
  collectedAmount: number;
  refundedAmount: number;
  expenseAmount: number;
  closingBalance: number;
  transactionCount: number;
}

export interface CashSettlement {
  id: string;
  settlementNumber: string;
  settlementDate: string;
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  companyId: string;
  status: CashSettlementStatus;
  settledById: string;
  settledBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  settledAt: string | null;
  verifiedById: string | null;
  verifiedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  verifiedAt: string | null;
  verificationNotes: string | null;
  rejectedById: string | null;
  rejectedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  totalCollected: number;
  totalRefunds: number;
  totalExpenses: number;
  netCashAmount: number;
  physicalCashCount: number;
  cashDifference: number;
  notes: string | null;
  methodBreakdowns: CashSettlementMethod[];
  denominations: CashDenomination | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashSettlementFilters {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  status?: CashSettlementStatus;
  page?: number;
  limit?: number;
}

export interface CreateSettlementDto {
  branchId: string;
  settlementDate?: string;
}

export interface UpdateDenominationsDto {
  note2000Count?: number;
  note500Count?: number;
  note200Count?: number;
  note100Count?: number;
  note50Count?: number;
  note20Count?: number;
  note10Count?: number;
  coin5Count?: number;
  coin2Count?: number;
  coin1Count?: number;
}

export interface UpdateNotesDto {
  notes: string;
}

export interface VerifySettlementDto {
  notes?: string;
}

export interface RejectSettlementDto {
  reason: string;
}

export interface PaginatedSettlements {
  settlements: CashSettlement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==================== Cash Settlement API ====================

export const cashSettlementApi = {
  /**
   * Create or get settlement for a date
   */
  createOrGet: async (data: CreateSettlementDto): Promise<CashSettlement> => {
    const response = await api.post('/cash-settlements', data);
    return response.data.data;
  },

  /**
   * Get today's settlement
   */
  getToday: async (branchId: string): Promise<CashSettlement> => {
    const params = new URLSearchParams();
    params.append('branchId', branchId);
    const response = await api.get(`/cash-settlements/today?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get settlements list (history)
   */
  getAll: async (filters?: CashSettlementFilters): Promise<PaginatedSettlements> => {
    const params = new URLSearchParams();
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/cash-settlements?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get settlement by ID
   */
  getById: async (id: string): Promise<CashSettlement> => {
    const response = await api.get(`/cash-settlements/${id}`);
    return response.data.data;
  },

  /**
   * Update cash denominations
   */
  updateDenominations: async (id: string, data: UpdateDenominationsDto): Promise<CashSettlement> => {
    const response = await api.put(`/cash-settlements/${id}/denominations`, data);
    return response.data.data;
  },

  /**
   * Update settlement notes
   */
  updateNotes: async (id: string, data: UpdateNotesDto): Promise<CashSettlement> => {
    const response = await api.put(`/cash-settlements/${id}/notes`, data);
    return response.data.data;
  },

  /**
   * Submit settlement for verification
   */
  submit: async (id: string): Promise<CashSettlement> => {
    const response = await api.post(`/cash-settlements/${id}/submit`);
    return response.data.data;
  },

  /**
   * Verify settlement (Manager/Admin only)
   */
  verify: async (id: string, data?: VerifySettlementDto): Promise<CashSettlement> => {
    const response = await api.post(`/cash-settlements/${id}/verify`, data || {});
    return response.data.data;
  },

  /**
   * Reject settlement (Manager/Admin only)
   */
  reject: async (id: string, data: RejectSettlementDto): Promise<CashSettlement> => {
    const response = await api.post(`/cash-settlements/${id}/reject`, data);
    return response.data.data;
  },
};

export default cashSettlementApi;
