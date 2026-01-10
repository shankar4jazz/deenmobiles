import { api } from './api';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null;
  gstin: string | null;
  stateCode: string | null;
  jobSheetInstructions: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  stateCode?: string;
  jobSheetInstructions?: string;
}

export const companyApi = {
  /**
   * Get current company details
   */
  getCompany: async (): Promise<Company> => {
    const response = await api.get('/company');
    return response.data.data;
  },

  /**
   * Update company details
   */
  updateCompany: async (data: UpdateCompanyData): Promise<Company> => {
    const response = await api.put('/company', data);
    return response.data.data;
  },
};
