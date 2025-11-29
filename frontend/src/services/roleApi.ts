import { api } from './api';
import { Role, RoleFormData, RoleFilters, Permission, PermissionGroup } from '../types';

export const roleApi = {
  /**
   * Create a new role
   */
  createRole: async (data: RoleFormData): Promise<Role> => {
    const response = await api.post('/roles', data);
    return response.data.data;
  },

  /**
   * Get all roles with filters and pagination
   */
  getAllRoles: async (
    filters?: RoleFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    roles: Role[];
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
    if (filters?.isSystemRole !== undefined)
      params.append('isSystemRole', filters.isSystemRole.toString());

    const response = await api.get(`/roles?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get role by ID
   */
  getRoleById: async (id: string): Promise<Role> => {
    const response = await api.get(`/roles/${id}`);
    return response.data.data;
  },

  /**
   * Update role
   */
  updateRole: async (
    id: string,
    data: Partial<RoleFormData>
  ): Promise<Role> => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete role
   */
  deleteRole: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/roles/${id}`);
    return response.data.data;
  },

  /**
   * Get simplified list of roles for dropdowns
   */
  getRolesList: async (): Promise<
    Array<{ id: string; name: string; isSystemRole: boolean }>
  > => {
    const response = await api.get('/roles/list/simple');
    return response.data.data;
  },

  /**
   * Assign permissions to a role
   */
  assignPermissions: async (
    roleId: string,
    permissionIds: string[]
  ): Promise<Role> => {
    const response = await api.post(`/roles/${roleId}/permissions`, {
      permissionIds,
    });
    return response.data.data;
  },

  /**
   * Remove permissions from a role
   */
  removePermissions: async (
    roleId: string,
    permissionIds: string[]
  ): Promise<Role> => {
    const response = await api.delete(`/roles/${roleId}/permissions`, {
      data: { permissionIds },
    });
    return response.data.data;
  },

  /**
   * Get all permissions
   */
  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await api.get('/permissions');
    return response.data.data;
  },

  /**
   * Get permissions grouped by resource
   */
  getPermissionsGrouped: async (): Promise<PermissionGroup[]> => {
    const response = await api.get('/permissions/grouped');
    return response.data.data;
  },
};
