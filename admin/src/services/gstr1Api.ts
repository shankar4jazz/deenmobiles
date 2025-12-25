import { api } from './api';

// GSTR1 Types
export interface B2BRecord {
  gstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  reverseCharge: boolean;
  invoiceType: string;
  rate: number;
  taxableValue: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  cessAmount: number;
}

export interface B2CLargeRecord {
  placeOfSupply: string;
  rate: number;
  taxableValue: number;
  igstAmount: number;
  cessAmount: number;
}

export interface B2CSmallRecord {
  type: string;
  placeOfSupply: string;
  rate: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
}

export interface HSNSummaryRecord {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  cessAmount: number;
}

export interface DocumentSummaryRecord {
  documentType: string;
  fromNumber: string;
  toNumber: string;
  totalCount: number;
  cancelledCount: number;
  netIssued: number;
}

export interface GSTR1Summary {
  totalTaxableValue: number;
  totalIGST: number;
  totalCGST: number;
  totalSGST: number;
  totalCess: number;
  totalTax: number;
  totalInvoices: number;
  b2bCount: number;
  b2cLargeCount: number;
  b2cSmallCount: number;
}

export interface GSTR1Report {
  period: string;
  b2b: B2BRecord[];
  b2cLarge: B2CLargeRecord[];
  b2cSmall: B2CSmallRecord[];
  hsnSummary: HSNSummaryRecord[];
  documentSummary: DocumentSummaryRecord[];
  summary: GSTR1Summary;
}

export interface GSTR1Filters {
  month: number;
  year: number;
  branchId?: string;
}

// GSTR1 API
export const gstr1Api = {
  // Get full GSTR1 report
  getFullReport: async (filters: GSTR1Filters): Promise<GSTR1Report> => {
    const response = await api.get('/reports/gstr1', { params: filters });
    return response.data.data;
  },

  // Get B2B invoices
  getB2BInvoices: async (filters: GSTR1Filters): Promise<B2BRecord[]> => {
    const response = await api.get('/reports/gstr1/b2b', { params: filters });
    return response.data.data;
  },

  // Get B2C Large invoices
  getB2CLargeInvoices: async (filters: GSTR1Filters): Promise<B2CLargeRecord[]> => {
    const response = await api.get('/reports/gstr1/b2c-large', { params: filters });
    return response.data.data;
  },

  // Get B2C Small invoices
  getB2CSmallInvoices: async (filters: GSTR1Filters): Promise<B2CSmallRecord[]> => {
    const response = await api.get('/reports/gstr1/b2c-small', { params: filters });
    return response.data.data;
  },

  // Get HSN Summary
  getHSNSummary: async (filters: GSTR1Filters): Promise<HSNSummaryRecord[]> => {
    const response = await api.get('/reports/gstr1/hsn-summary', { params: filters });
    return response.data.data;
  },

  // Get Document Summary
  getDocumentSummary: async (filters: GSTR1Filters): Promise<DocumentSummaryRecord[]> => {
    const response = await api.get('/reports/gstr1/document-summary', { params: filters });
    return response.data.data;
  },

  // Export GSTR1 to Excel
  exportToExcel: async (filters: GSTR1Filters): Promise<Blob> => {
    const response = await api.get('/reports/gstr1/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default gstr1Api;
