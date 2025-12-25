import { api } from './api';
import { Employee, EmployeeFormData, EmployeeUpdateData, EmployeeFilters, UserRole } from '../types';

export const employeeApi = {
  /**
   * Create a new employee
   */
  createEmployee: async (data: EmployeeFormData): Promise<Employee> => {
    // If profileImage is a File, use FormData
    if (data.profileImage instanceof File) {
      const formData = new FormData();

      // Append all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await api.post('/employees', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    }

    // Otherwise, use regular JSON
    const response = await api.post('/employees', data);
    return response.data.data;
  },

  /**
   * Get all employees with filters and pagination
   */
  getAllEmployees: async (
    filters?: EmployeeFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    employees: Employee[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters?.search) params.append('search', filters.search);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/employees?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get employee by ID
   */
  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await api.get(`/employees/${id}`);
    return response.data.data;
  },

  /**
   * Update employee
   */
  updateEmployee: async (
    id: string,
    data: EmployeeUpdateData
  ): Promise<Employee> => {
    // If profileImage is a File, use FormData
    if (data.profileImage instanceof File) {
      const formData = new FormData();

      // Append all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await api.put(`/employees/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    }

    // Otherwise, use regular JSON
    const response = await api.put(`/employees/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete employee
   */
  deleteEmployee: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/employees/${id}`);
    return response.data.data;
  },

  /**
   * Get employees by role
   */
  getEmployeesByRole: async (role: UserRole): Promise<Employee[]> => {
    const response = await api.get(`/employees/role/${role}`);
    return response.data.data;
  },

  /**
   * Check if username is available
   */
  checkUsernameAvailability: async (
    username: string,
    excludeUserId?: string
  ): Promise<{ available: boolean }> => {
    const params = new URLSearchParams();
    params.append('username', username);
    if (excludeUserId) params.append('excludeUserId', excludeUserId);

    const response = await api.get(`/employees/check-username?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Add an existing employee to a branch
   */
  addEmployeeToBranch: async (
    employeeId: string,
    branchId: string
  ): Promise<Employee> => {
    const response = await api.post(`/employees/${employeeId}/add-to-branch`, {
      branchId,
    });
    return response.data.data;
  },

  /**
   * Transfer employee to a different branch
   */
  transferEmployee: async (
    employeeId: string,
    branchId: string
  ): Promise<Employee> => {
    const response = await api.put(`/employees/${employeeId}/transfer`, {
      branchId,
    });
    return response.data.data;
  },

  /**
   * Remove employee from their current branch
   */
  removeEmployeeFromBranch: async (employeeId: string): Promise<Employee> => {
    const response = await api.delete(`/employees/${employeeId}/remove-from-branch`);
    return response.data.data;
  },
};
