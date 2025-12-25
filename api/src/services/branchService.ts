import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

interface CreateBranchData {
  name: string;
  code: string;
  companyId: string;
  address: string;
  phone: string;
  email: string;
  managerId?: string;
  isActive?: boolean;
}

interface UpdateBranchData {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string | null;
  isActive?: boolean;
}

interface BranchFilters {
  companyId: string;
  search?: string;
  isActive?: boolean;
  managerId?: string;
}

export class BranchService {
  /**
   * Helper method to clear managerId from a branch when its manager is reassigned
   * Returns the name of the old branch if one was cleared, null otherwise
   */
  private static async clearOldBranchManager(
    managerId: string,
    tx: any
  ): Promise<{ branchId: string; branchName: string } | null> {
    try {
      // Find if this manager is already managing another branch
      const oldManagedBranch = await tx.branch.findFirst({
        where: {
          managerId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (oldManagedBranch) {
        // Clear the old branch's manager
        await tx.branch.update({
          where: { id: oldManagedBranch.id },
          data: { managerId: null },
        });

        Logger.info('Cleared old branch manager during reassignment', {
          oldBranchId: oldManagedBranch.id,
          oldBranchName: oldManagedBranch.name,
          managerId,
        });

        return {
          branchId: oldManagedBranch.id,
          branchName: oldManagedBranch.name,
        };
      }

      return null;
    } catch (error) {
      Logger.error('Error clearing old branch manager', { error, managerId });
      throw error;
    }
  }

  /**
   * Create a new branch
   */
  static async createBranch(data: CreateBranchData) {
    try {
      // Check if company exists
      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
      });

      if (!company) {
        throw new AppError(404, 'Company not found');
      }

      // Check if branch code already exists
      const existingBranch = await prisma.branch.findUnique({
        where: { code: data.code },
      });

      if (existingBranch) {
        throw new AppError(400, 'Branch code already exists');
      }

      // Check if manager exists and belongs to the same company
      if (data.managerId) {
        const manager = await prisma.user.findFirst({
          where: {
            id: data.managerId,
            companyId: data.companyId,
            role: { in: ['MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
          },
        });

        if (!manager) {
          throw new AppError(
            400,
            'Manager not found or does not have appropriate role'
          );
        }
      }

      // Use transaction to ensure data consistency
      let reassignmentWarning: string | null = null;

      const branch = await prisma.$transaction(async (tx) => {
        // If a manager is assigned, check and clear their old branch assignment
        if (data.managerId) {
          const oldBranch = await this.clearOldBranchManager(data.managerId, tx);
          if (oldBranch) {
            reassignmentWarning = `Manager was reassigned from "${oldBranch.branchName}" to this branch. The old branch no longer has a manager.`;
          }
        }

        // Create the branch
        const newBranch = await tx.branch.create({
          data: {
            name: data.name,
            code: data.code,
            companyId: data.companyId,
            address: data.address,
            phone: data.phone,
            email: data.email,
            managerId: data.managerId,
            isActive: data.isActive ?? true,
          },
          include: {
            company: {
              select: { id: true, name: true },
            },
            manager: {
              select: { id: true, name: true, email: true, role: true },
            },
            _count: {
              select: { users: true },
            },
          },
        });

        // If a manager is assigned, update their branchId to this branch
        if (data.managerId) {
          await tx.user.update({
            where: { id: data.managerId },
            data: {
              branchId: newBranch.id,
            },
          });
        }

        return newBranch;
      });

      Logger.info('Branch created successfully', {
        branchId: branch.id,
        reassigned: !!reassignmentWarning
      });

      return {
        branch,
        warning: reassignmentWarning,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating branch', { error });
      throw new AppError(500, 'Failed to create branch');
    }
  }

  /**
   * Get all branches with filters and pagination
   */
  static async getAllBranches(
    filters: BranchFilters,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        companyId: filters.companyId,
      };

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
          { address: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.managerId) {
        where.managerId = filters.managerId;
      }

      const [branches, total] = await Promise.all([
        prisma.branch.findMany({
          where,
          skip,
          take: limit,
          include: {
            company: {
              select: { id: true, name: true },
            },
            manager: {
              select: { id: true, name: true, email: true, role: true },
            },
            _count: {
              select: { users: true, customers: true, services: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.branch.count({ where }),
      ]);

      return {
        branches,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching branches', { error });
      throw new AppError(500, 'Failed to fetch branches');
    }
  }

  /**
   * Get branch by ID
   */
  static async getBranchById(id: string, companyId: string) {
    try {
      const branch = await prisma.branch.findFirst({
        where: {
          id,
          companyId,
        },
        include: {
          company: {
            select: { id: true, name: true },
          },
          manager: {
            select: { id: true, name: true, email: true, phone: true, role: true },
          },
          users: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
          },
          _count: {
            select: { users: true, customers: true, services: true },
          },
        },
      });

      if (!branch) {
        throw new AppError(404, 'Branch not found');
      }

      return branch;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching branch', { error, branchId: id });
      throw new AppError(500, 'Failed to fetch branch');
    }
  }

  /**
   * Update branch
   */
  static async updateBranch(
    id: string,
    companyId: string,
    data: UpdateBranchData
  ) {
    try {
      // Check if branch exists and belongs to company
      const existingBranch = await prisma.branch.findFirst({
        where: { id, companyId },
      });

      if (!existingBranch) {
        throw new AppError(404, 'Branch not found');
      }

      // Check if new code already exists (if code is being updated)
      if (data.code && data.code !== existingBranch.code) {
        const codeExists = await prisma.branch.findUnique({
          where: { code: data.code },
        });

        if (codeExists) {
          throw new AppError(400, 'Branch code already exists');
        }
      }

      // Check if manager exists and belongs to the same company
      if (data.managerId !== undefined && data.managerId !== null) {
        const manager = await prisma.user.findFirst({
          where: {
            id: data.managerId,
            companyId,
            role: { in: ['MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
          },
        });

        if (!manager) {
          throw new AppError(
            400,
            'Manager not found or does not have appropriate role'
          );
        }
      }

      // Use transaction to ensure data consistency
      let reassignmentWarning: string | null = null;

      const updatedBranch = await prisma.$transaction(async (tx) => {
        // If manager is being changed, check and clear their old branch assignment
        if (data.managerId !== undefined) {
          const oldManagerId = existingBranch.managerId;
          const newManagerId = data.managerId;

          // If manager changed (and new manager is not null)
          if (oldManagerId !== newManagerId && newManagerId !== null) {
            // Clear the new manager's existing branch assignment (if any)
            const oldBranch = await this.clearOldBranchManager(newManagerId, tx);
            if (oldBranch) {
              reassignmentWarning = `Manager was reassigned from "${oldBranch.branchName}" to this branch. The old branch no longer has a manager.`;
            }
          }
        }

        // Update the branch
        const branch = await tx.branch.update({
          where: { id },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.code && { code: data.code }),
            ...(data.address && { address: data.address }),
            ...(data.phone && { phone: data.phone }),
            ...(data.email && { email: data.email }),
            ...(data.managerId !== undefined && { managerId: data.managerId }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          },
          include: {
            company: {
              select: { id: true, name: true },
            },
            manager: {
              select: { id: true, name: true, email: true, role: true },
            },
            _count: {
              select: { users: true },
            },
          },
        });

        // If manager is being changed, update the new manager's branchId
        if (data.managerId !== undefined) {
          const oldManagerId = existingBranch.managerId;
          const newManagerId = data.managerId;

          // If manager changed (and new manager is not null)
          if (oldManagerId !== newManagerId && newManagerId !== null) {
            // Update new manager's branchId to this branch
            await tx.user.update({
              where: { id: newManagerId },
              data: {
                branchId: id,
              },
            });
          }
        }

        return branch;
      });

      Logger.info('Branch updated successfully', {
        branchId: id,
        reassigned: !!reassignmentWarning,
      });

      return {
        branch: updatedBranch,
        warning: reassignmentWarning,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating branch', { error, branchId: id });
      throw new AppError(500, 'Failed to update branch');
    }
  }

  /**
   * Delete branch
   */
  static async deleteBranch(id: string, companyId: string) {
    try {
      // Check if branch exists and belongs to company
      const branch = await prisma.branch.findFirst({
        where: { id, companyId },
        include: {
          _count: {
            select: { users: true, customers: true, services: true },
          },
        },
      });

      if (!branch) {
        throw new AppError(404, 'Branch not found');
      }

      // Check if branch has associated data
      if (
        branch._count.users > 0 ||
        branch._count.customers > 0 ||
        branch._count.services > 0
      ) {
        throw new AppError(
          400,
          'Cannot delete branch with associated users, customers, or services. Please reassign or delete them first.'
        );
      }

      await prisma.branch.delete({
        where: { id },
      });

      Logger.info('Branch deleted successfully', { branchId: id });

      return { message: 'Branch deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deleting branch', { error, branchId: id });
      throw new AppError(500, 'Failed to delete branch');
    }
  }

  /**
   * Get branches by company (simplified list for dropdowns)
   */
  static async getBranchesByCompany(companyId: string) {
    try {
      const branches = await prisma.branch.findMany({
        where: {
          companyId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: { name: 'asc' },
      });

      return branches;
    } catch (error) {
      Logger.error('Error fetching company branches', { error, companyId });
      throw new AppError(500, 'Failed to fetch company branches');
    }
  }

  /**
   * Get available managers for a branch with their current assignments
   */
  static async getAvailableManagers(companyId: string) {
    try {
      const managers = await prisma.user.findMany({
        where: {
          companyId,
          isActive: true,
          role: { in: ['MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          branchId: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          managedBranches: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Format response to include assignment info
      const managersWithAssignment = managers.map(manager => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        assignedToBranchId: manager.branchId,
        assignedToBranchName: manager.branch?.name || null,
        managingBranches: manager.managedBranches.map(b => ({
          id: b.id,
          name: b.name,
          code: b.code,
        })),
      }));

      return managersWithAssignment;
    } catch (error) {
      Logger.error('Error fetching available managers', { error, companyId });
      throw new AppError(500, 'Failed to fetch available managers');
    }
  }

  /**
   * Get all employees for a specific branch
   */
  static async getBranchEmployees(branchId: string, companyId: string) {
    try {
      // Verify branch exists and belongs to company
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, companyId },
      });

      if (!branch) {
        throw new AppError(404, 'Branch not found');
      }

      const employees = await prisma.user.findMany({
        where: {
          branchId,
          companyId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' },
        ],
      });

      return employees;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching branch employees', { error, branchId });
      throw new AppError(500, 'Failed to fetch branch employees');
    }
  }
}
