import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

interface CreateRoleData {
  name: string;
  description?: string;
  companyId: string;
  permissionIds?: string[];
}

interface UpdateRoleData {
  name?: string;
  description?: string;
}

interface RoleFilters {
  companyId: string;
  search?: string;
  includeSystem?: boolean;
}

export class RoleService {
  /**
   * Create a new custom role
   */
  static async createRole(data: CreateRoleData) {
    try {
      // Check if company exists
      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
      });

      if (!company) {
        throw new AppError(404, 'Company not found');
      }

      // Check if role name already exists for this company
      const existingRole = await prisma.role.findFirst({
        where: {
          name: data.name,
          companyId: data.companyId,
        },
      });

      if (existingRole) {
        throw new AppError(400, 'Role with this name already exists for your company');
      }

      // Validate permission IDs if provided
      if (data.permissionIds && data.permissionIds.length > 0) {
        const permissions = await prisma.permission.findMany({
          where: { id: { in: data.permissionIds } },
        });

        if (permissions.length !== data.permissionIds.length) {
          throw new AppError(400, 'One or more permission IDs are invalid');
        }
      }

      // Create role with permissions
      const role = await prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
          companyId: data.companyId,
          isSystemRole: false,
          permissions: data.permissionIds
            ? {
                create: data.permissionIds.map((permissionId) => ({
                  permissionId,
                })),
              }
            : undefined,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { users: true },
          },
        },
      });

      Logger.info('Role created successfully', { roleId: role.id });

      return role;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating role', { error });
      throw new AppError(500, 'Failed to create role');
    }
  }

  /**
   * Get all roles with filters
   */
  static async getAllRoles(filters: RoleFilters, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        OR: [
          { companyId: filters.companyId },
          { isSystemRole: filters.includeSystem !== false },
        ],
      };

      if (filters.search) {
        where.AND = [
          {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        ];
      }

      const [roles, total] = await Promise.all([
        prisma.role.findMany({
          where,
          skip,
          take: limit,
          include: {
            company: {
              select: { id: true, name: true },
            },
            permissions: {
              include: {
                permission: {
                  select: { id: true, name: true, resource: true, action: true },
                },
              },
            },
            _count: {
              select: { users: true },
            },
          },
          orderBy: [
            { isSystemRole: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.role.count({ where }),
      ]);

      return {
        roles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching roles', { error });
      throw new AppError(500, 'Failed to fetch roles');
    }
  }

  /**
   * Get role by ID
   */
  static async getRoleById(id: string, companyId: string) {
    try {
      const role = await prisma.role.findFirst({
        where: {
          id,
          OR: [
            { companyId },
            { isSystemRole: true },
          ],
        },
        include: {
          company: {
            select: { id: true, name: true },
          },
          permissions: {
            include: {
              permission: {
                select: { id: true, name: true, description: true, resource: true, action: true },
              },
            },
          },
          users: {
            select: { id: true, name: true, email: true, role: true },
          },
          _count: {
            select: { users: true },
          },
        },
      });

      if (!role) {
        throw new AppError(404, 'Role not found');
      }

      return role;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching role', { error, roleId: id });
      throw new AppError(500, 'Failed to fetch role');
    }
  }

  /**
   * Update role (only custom roles)
   */
  static async updateRole(id: string, companyId: string, data: UpdateRoleData) {
    try {
      // Check if role exists and is not a system role
      const existingRole = await prisma.role.findFirst({
        where: {
          id,
          companyId,
          isSystemRole: false,
        },
      });

      if (!existingRole) {
        throw new AppError(404, 'Role not found or cannot be modified (system role)');
      }

      // Check if new name already exists for this company
      if (data.name && data.name !== existingRole.name) {
        const nameExists = await prisma.role.findFirst({
          where: {
            name: data.name,
            companyId,
            id: { not: id },
          },
        });

        if (nameExists) {
          throw new AppError(400, 'Role with this name already exists for your company');
        }
      }

      const updatedRole = await prisma.role.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { users: true },
          },
        },
      });

      Logger.info('Role updated successfully', { roleId: id });

      return updatedRole;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating role', { error, roleId: id });
      throw new AppError(500, 'Failed to update role');
    }
  }

  /**
   * Delete role (only custom roles)
   */
  static async deleteRole(id: string, companyId: string) {
    try {
      // Check if role exists and is not a system role
      const role = await prisma.role.findFirst({
        where: {
          id,
          companyId,
          isSystemRole: false,
        },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      if (!role) {
        throw new AppError(404, 'Role not found or cannot be deleted (system role)');
      }

      // Check if role has users assigned
      if (role._count.users > 0) {
        throw new AppError(
          400,
          'Cannot delete role with assigned users. Please reassign users first.'
        );
      }

      // Delete role (permissions will be deleted automatically due to cascade)
      await prisma.role.delete({
        where: { id },
      });

      Logger.info('Role deleted successfully', { roleId: id });

      return { message: 'Role deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deleting role', { error, roleId: id });
      throw new AppError(500, 'Failed to delete role');
    }
  }

  /**
   * Assign permissions to role
   */
  static async assignPermissions(roleId: string, companyId: string, permissionIds: string[]) {
    try {
      // Check if role exists and is not a system role
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          companyId,
          isSystemRole: false,
        },
      });

      if (!role) {
        throw new AppError(404, 'Role not found or cannot be modified (system role)');
      }

      // Validate permission IDs
      const permissions = await prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      });

      if (permissions.length !== permissionIds.length) {
        throw new AppError(400, 'One or more permission IDs are invalid');
      }

      // Get existing permissions
      const existingPermissions = await prisma.rolePermission.findMany({
        where: { roleId },
        select: { permissionId: true },
      });

      const existingPermissionIds = existingPermissions.map((rp) => rp.permissionId);

      // Find new permissions to add
      const newPermissionIds = permissionIds.filter(
        (id) => !existingPermissionIds.includes(id)
      );

      // Add new permissions
      if (newPermissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: newPermissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      // Get updated role with permissions
      const updatedRole = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      Logger.info('Permissions assigned to role', { roleId, permissionCount: newPermissionIds.length });

      return updatedRole;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error assigning permissions', { error, roleId });
      throw new AppError(500, 'Failed to assign permissions');
    }
  }

  /**
   * Remove permissions from role
   */
  static async removePermissions(roleId: string, companyId: string, permissionIds: string[]) {
    try {
      // Check if role exists and is not a system role
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          companyId,
          isSystemRole: false,
        },
      });

      if (!role) {
        throw new AppError(404, 'Role not found or cannot be modified (system role)');
      }

      // Remove permissions
      await prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId: { in: permissionIds },
        },
      });

      // Get updated role with permissions
      const updatedRole = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      Logger.info('Permissions removed from role', { roleId, permissionCount: permissionIds.length });

      return updatedRole;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error removing permissions', { error, roleId });
      throw new AppError(500, 'Failed to remove permissions');
    }
  }

  /**
   * Get simplified list of roles for dropdowns
   */
  static async getRolesList(companyId: string) {
    try {
      const roles = await prisma.role.findMany({
        where: {
          OR: [
            { companyId },
            { isSystemRole: true },
          ],
        },
        select: {
          id: true,
          name: true,
          isSystemRole: true,
        },
        orderBy: [
          { isSystemRole: 'desc' },
          { name: 'asc' },
        ],
      });

      return roles;
    } catch (error) {
      Logger.error('Error fetching roles list', { error, companyId });
      throw new AppError(500, 'Failed to fetch roles list');
    }
  }
}
