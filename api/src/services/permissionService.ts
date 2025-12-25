import prisma from '../config/database';

export class PermissionService {
  /**
   * Get all permissions
   */
  static async getAllPermissions() {
    return await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  /**
   * Get permissions grouped by resource
   */
  static async getPermissionsGrouped() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group by resource
    const grouped = permissions.reduce((acc: Record<string, typeof permissions>, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return Object.entries(grouped).map(([resource, perms]) => ({
      resource,
      permissions: perms,
    }));
  }
}
