import { api } from './api';

export enum DocumentType {
  JOB_SHEET = 'JOB_SHEET',
  SERVICE_TICKET = 'SERVICE_TICKET',
  INVOICE = 'INVOICE',
  ESTIMATE = 'ESTIMATE',
}

export enum SequenceResetFrequency {
  NEVER = 'NEVER',
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface DocumentNumberFormat {
  id: string;
  documentType: DocumentType;
  prefix: string;
  separator: string;
  sequenceResetFrequency: SequenceResetFrequency;
  sequenceLength: number;
  includeBranch: boolean;
  branchFormat: string;
  includeYear: boolean;
  yearFormat: string;
  includeMonth: boolean;
  includeDay: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFormatData {
  prefix?: string;
  separator?: string;
  sequenceResetFrequency?: SequenceResetFrequency;
  sequenceLength?: number;
  includeBranch?: boolean;
  branchFormat?: string;
  includeYear?: boolean;
  yearFormat?: string;
  includeMonth?: boolean;
  includeDay?: boolean;
}

export const documentNumberApi = {
  /**
   * Get all document number formats
   */
  getAllFormats: async (): Promise<DocumentNumberFormat[]> => {
    const response = await api.get('/document-numbers');
    return response.data.data;
  },

  /**
   * Get a specific format by document type
   */
  getFormat: async (documentType: DocumentType): Promise<DocumentNumberFormat | null> => {
    const response = await api.get(`/document-numbers/${documentType}`);
    return response.data.data;
  },

  /**
   * Update a document number format
   */
  updateFormat: async (documentType: DocumentType, data: UpdateFormatData): Promise<DocumentNumberFormat> => {
    const response = await api.put(`/document-numbers/${documentType}`, data);
    return response.data.data;
  },

  /**
   * Preview a format
   */
  previewFormat: async (format: UpdateFormatData & { prefix?: string; separator?: string }, branchCode?: string): Promise<string> => {
    const response = await api.post('/document-numbers/preview', { format, branchCode });
    return response.data.data.preview;
  },

  /**
   * Get sequence info for a document type
   */
  getSequenceInfo: async (documentType: DocumentType) => {
    const response = await api.get(`/document-numbers/${documentType}/sequence`);
    return response.data.data;
  },
};
