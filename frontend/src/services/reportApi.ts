import { api } from './api';

// Report Types
export interface BookingPersonSummary {
  userId: string;
  userName: string;
  serviceCount: number;
  totalRevenue: number;
  avgPerService: number;
}

export interface TechnicianSummary {
  technicianId: string;
  technicianName: string;
  completedCount: number;
  pendingCount: number;
  totalRevenue: number;
  avgCompletionTimeHours: number | null;
}

export interface BrandSummary {
  brandId: string;
  brandName: string;
  serviceCount: number;
  totalRevenue: number;
}

export interface FaultSummary {
  faultId: string;
  faultName: string;
  serviceCount: number;
  totalRevenue: number;
}

export interface TransactionDetail {
  id: string;
  amount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentDate: string;
  notes: string | null;
  transactionId: string | null;
  serviceId: string | null;
  ticketNumber: string | null;
  customerName: string | null;
}

export interface PaymentMethodBreakdown {
  methodId: string;
  methodName: string;
  amount: number;
  count: number;
}

export interface CashSettlementMethod {
  paymentMethodId: string;
  paymentMethodName: string;
  openingBalance: number;
  receivedAmount: number;
  closingBalance: number;
}

export interface BookingPersonReport {
  summary: BookingPersonSummary[];
  details: any[];
  totals: {
    totalServices: number;
    totalRevenue: number;
    uniqueBookingPersons: number;
  };
}

export interface TechnicianReport {
  summary: TechnicianSummary[];
  details: any[];
  totals: {
    totalServices: number;
    totalCompleted: number;
    totalPending: number;
    totalRevenue: number;
    uniqueTechnicians: number;
  };
}

export interface BrandReport {
  summary: BrandSummary[];
  details: any[];
  totals: {
    totalServices: number;
    totalRevenue: number;
    uniqueBrands: number;
  };
}

export interface FaultReport {
  summary: FaultSummary[];
  details: any[];
  totals: {
    totalServices: number;
    totalRevenue: number;
    uniqueFaults: number;
  };
}

export interface DailyTransactionReport {
  date: string;
  totalAmount: number;
  paymentCount: number;
  byMethod: PaymentMethodBreakdown[];
  transactions: TransactionDetail[];
}

export interface MonthlyTransactionReport {
  year: number;
  month: number;
  totalAmount: number;
  paymentCount: number;
  byDay: { date: string; amount: number; count: number }[];
  byMethod: PaymentMethodBreakdown[];
  transactions: TransactionDetail[];
}

export interface DailyCashSettlementReport {
  date: string;
  branchId: string;
  branchName: string;
  byMethod: CashSettlementMethod[];
  transactions: TransactionDetail[];
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  branchId?: string;
}

export interface DateFilter {
  date: string;
  branchId?: string;
}

export interface MonthFilter {
  year: number;
  month: number;
  branchId?: string;
}

// Report API
export const reportApi = {
  // 1. Booking Person Wise Report
  getBookingPersonReport: async (filters: ReportFilters): Promise<BookingPersonReport> => {
    const response = await api.get('/reports/booking-person', { params: filters });
    return response.data.data;
  },

  // 2. Technician Wise Report
  getTechnicianReport: async (filters: ReportFilters): Promise<TechnicianReport> => {
    const response = await api.get('/reports/technician', { params: filters });
    return response.data.data;
  },

  // 3. Brand Wise Report
  getBrandReport: async (filters: ReportFilters): Promise<BrandReport> => {
    const response = await api.get('/reports/brand', { params: filters });
    return response.data.data;
  },

  // 4. Fault Wise Report
  getFaultReport: async (filters: ReportFilters): Promise<FaultReport> => {
    const response = await api.get('/reports/fault', { params: filters });
    return response.data.data;
  },

  // 5. Daily Transaction Report
  getDailyTransactionReport: async (filters: DateFilter): Promise<DailyTransactionReport> => {
    const response = await api.get('/reports/daily-transaction', { params: filters });
    return response.data.data;
  },

  // 6. Monthly Transaction Report
  getMonthlyTransactionReport: async (filters: MonthFilter): Promise<MonthlyTransactionReport> => {
    const response = await api.get('/reports/monthly-transaction', { params: filters });
    return response.data.data;
  },

  // 7. Daily Cash Settlement Report
  getDailyCashSettlement: async (filters: DateFilter): Promise<DailyCashSettlementReport> => {
    const response = await api.get('/reports/cash-settlement', { params: filters });
    return response.data.data;
  },

  // Set Opening Balance
  setOpeningBalance: async (data: {
    branchId: string;
    date: string;
    paymentMethodId: string;
    openingAmount: number;
  }) => {
    const response = await api.post('/reports/opening-balance', data);
    return response.data.data;
  },

  // Set Closing Balance
  setClosingBalance: async (data: {
    branchId: string;
    date: string;
    paymentMethodId: string;
    closingAmount: number;
  }) => {
    const response = await api.post('/reports/closing-balance', data);
    return response.data.data;
  },

  // Export Report
  exportReport: async (data: {
    reportType: string;
    format: 'pdf' | 'excel';
    reportData: any;
    title: string;
  }): Promise<Blob> => {
    const response = await api.post('/reports/export', data, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default reportApi;
