import { api } from './api';

// Invoice Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  serviceId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  pdfUrl?: string;
  notes?: string;
  companyId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  service?: {
    id: string;
    ticketNumber: string;
    deviceModel: string;
    issue: string;
    customer: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  payments?: InvoicePayment[];
  _count?: {
    payments: number;
  };
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethodId: string;
  transactionId?: string;
  notes?: string;
  paymentDate?: string; // Optional - fallback to createdAt
  createdAt: string;
  paymentMethod?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateInvoiceData {
  serviceId?: string; // For service-linked invoices
  customerId?: string; // For standalone invoices
  branchId?: string; // For standalone invoices
  items?: Array<{ // For standalone invoices
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  totalAmount?: number;
  paidAmount?: number;
  notes?: string;
}

export interface UpdateInvoiceData {
  totalAmount?: number;
  paidAmount?: number;
}

export interface RecordPaymentData {
  amount: number;
  paymentMethodId: string;
  transactionId?: string;
  notes?: string;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface InvoiceListResponse {
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Invoice API Functions
export const invoiceApi = {
  // Generate invoice from service
  generateFromService: async (serviceId: string): Promise<Invoice> => {
    const response = await api.post(`/services/${serviceId}/invoice`);
    return response.data.data;
  },

  // Create standalone invoice
  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await api.post('/invoices', data);
    return response.data.data;
  },

  // Get all invoices with filters
  getAll: async (filters: InvoiceFilters = {}): Promise<InvoiceListResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/invoices?${params.toString()}`);
    return response.data.data;
  },

  // Get invoice by ID
  getById: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data.data;
  },

  // Get invoice by service ID
  getByServiceId: async (serviceId: string): Promise<Invoice | null> => {
    const response = await api.get(`/services/${serviceId}/invoice`);
    return response.data.data;
  },

  // Update invoice
  update: async (id: string, data: UpdateInvoiceData): Promise<Invoice> => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data.data;
  },

  // Delete invoice
  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },

  // Sync invoice from service - recalculates totals from current service data
  syncFromService: async (id: string): Promise<Invoice> => {
    const response = await api.put(`/invoices/${id}/sync`);
    return response.data.data;
  },

  // Record payment
  recordPayment: async (id: string, data: RecordPaymentData): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/payments`, data);
    return response.data.data;
  },

  // Download invoice PDF (streams on-demand, returns blob URL)
  downloadPDF: async (id: string, format: string = 'A4'): Promise<{ pdfUrl: string }> => {
    const response = await api.get(
      `/invoices/${id}/pdf?format=${format}`,
      { responseType: 'blob' }
    );
    // Create a blob URL for the PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(blob);
    return { pdfUrl };
  },

  // Regenerate invoice PDF
  regeneratePDF: async (id: string): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/regenerate-pdf`);
    return response.data.data;
  },

  // ═══════════════════════════════════════════════════════════════
  // SALES TAX INVOICE PDF (GST Compliant Format)
  // ═══════════════════════════════════════════════════════════════

  // Stream Sales Tax Invoice PDF on-demand (no file saved) - for viewing
  // Returns a blob URL that can be used to display the PDF
  streamSalesTaxInvoicePDF: async (invoiceId: string): Promise<string> => {
    const response = await api.get(
      `/invoices/${invoiceId}/tax-invoice/stream`,
      { responseType: 'blob' }
    );
    // Create a blob URL for the PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  },

  // Download Sales Tax Invoice PDF on-demand (no file saved)
  downloadSalesTaxInvoicePDF: async (invoiceId: string): Promise<void> => {
    const response = await api.get(
      `/invoices/${invoiceId}/tax-invoice/download`,
      { responseType: 'blob' }
    );
    // Create a download link
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tax_invoice_${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Get shareable Sales Tax Invoice URL (for WhatsApp sharing)
  // This saves the PDF to storage and returns a shareable URL
  getShareableSalesTaxInvoiceURL: async (
    invoiceId: string
  ): Promise<{ pdfUrl: string; invoiceNumber: string }> => {
    const response = await api.post(`/invoices/${invoiceId}/tax-invoice/share`);
    return response.data.data;
  },
};
