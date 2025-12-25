import { api } from './api';

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
    branchId: string | null;
    managedBranchId?: string | null;
    branch?: {
      id: string;
      name: string;
      code: string;
    } | null;
    managedBranch?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  companyId: string;
  branchId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  } | null;
}

export const authApi = {
  login: async (identifier: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', {
      identifier,
      password,
      rememberMe,
    });
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await api.post('/auth/refresh');
    return response.data.data;
  },

  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  register: async (userData: {
    email: string;
    username?: string;
    password: string;
    name: string;
    phone?: string;
    role: string;
    companyId: string;
    branchId?: string;
  }): Promise<{ id: string; email: string; username?: string | null; name: string }> => {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  },
};
