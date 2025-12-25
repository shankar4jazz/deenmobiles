import { api } from './api';
import { DashboardData } from '../types';

export const dashboardApi = {
  /**
   * Get complete dashboard data (stats, charts, activity)
   */
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await api.get('/dashboard/data');
    return response.data.data;
  },

  /**
   * Get only dashboard statistics
   */
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  },

  /**
   * Get chart data
   */
  getCharts: async () => {
    const response = await api.get('/dashboard/charts');
    return response.data.data;
  },

  /**
   * Get recent activity
   */
  getRecentActivity: async (limit: number = 5) => {
    const response = await api.get(`/dashboard/activity?limit=${limit}`);
    return response.data.data;
  },

  /**
   * Get Admin dashboard with company-wide overview
   */
  getAdminDashboard: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data.data;
  },

  /**
   * Get Branch Manager dashboard
   */
  getManagerDashboard: async () => {
    const response = await api.get('/dashboard/manager');
    return response.data.data;
  },

  /**
   * Get Receptionist dashboard
   */
  getReceptionistDashboard: async () => {
    const response = await api.get('/dashboard/receptionist');
    return response.data.data;
  },

  /**
   * Get Technician Manager dashboard
   */
  getTechnicianManagerDashboard: async () => {
    const response = await api.get('/dashboard/technician-manager');
    return response.data.data;
  },

  /**
   * Get Technician dashboard
   */
  getTechnicianDashboard: async () => {
    const response = await api.get('/dashboard/technician');
    return response.data.data;
  },

  /**
   * Get Super Admin dashboard with all branches summary
   */
  getSuperAdminDashboard: async (params?: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.period) queryParams.append('period', params.period);

    const queryString = queryParams.toString();
    const url = `/dashboard/super-admin${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data.data;
  },

  /**
   * Get detailed analytics for a specific branch
   */
  getBranchAnalytics: async (branchId: string, params?: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.period) queryParams.append('period', params.period);

    const queryString = queryParams.toString();
    const url = `/dashboard/branch/${branchId}/analytics${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data.data;
  },

  /**
   * Get financial report for a specific branch
   */
  getBranchFinancialReport: async (branchId: string, params?: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.period) queryParams.append('period', params.period);

    const queryString = queryParams.toString();
    const url = `/dashboard/branch/${branchId}/financial${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data.data;
  },

  /**
   * Get inventory report for a specific branch
   */
  getBranchInventoryReport: async (branchId: string) => {
    const response = await api.get(`/dashboard/branch/${branchId}/inventory`);
    return response.data.data;
  },

  /**
   * Get operations report for a specific branch
   */
  getBranchOperationsReport: async (branchId: string, params?: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.period) queryParams.append('period', params.period);

    const queryString = queryParams.toString();
    const url = `/dashboard/branch/${branchId}/operations${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data.data;
  },

  /**
   * Get customer report for a specific branch
   */
  getBranchCustomerReport: async (branchId: string, params?: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.period) queryParams.append('period', params.period);

    const queryString = queryParams.toString();
    const url = `/dashboard/branch/${branchId}/customers${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data.data;
  },
};
