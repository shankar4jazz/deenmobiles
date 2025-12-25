import prisma from '../config/database';
import { UserRole } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { hashPassword } from '../utils/password';
import { FileUtils } from '../utils/fileUtils';

interface CreateEmployeeData {
  email?: string;
  username?: string;
  password: string;
  name: string;
  phone?: string;
  profileImage?: string;
  role: UserRole;
  roleId?: string;
  customRoleId?: string;
  companyId: string;
  branchId?: string;
  isActive?: boolean;
}

interface UpdateEmployeeData {
  email?: string;
  username?: string;
  password?: string;
  name?: string;
  phone?: string;
  profileImage?: string | null;
  role?: UserRole;
  roleId?: string | null;
  customRoleId?: string | null;
  branchId?: string | null;
  isActive?: boolean;
}

interface EmployeeFilters {
  companyId: string;
  search?: string;
  role?: UserRole;
  branchId?: string;
  isActive?: boolean;
}

export class EmployeeService {
  /**
   * Create a new employee
   */
  static async createEmployee(data: CreateEmployeeData) {
    try {
      // Check if company exists
      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
      });

      if (!company) {
        throw new AppError(404, 'Company not found');
      }

      // Check if email already exists (only if email is provided)
      if (data.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingEmail) {
          throw new AppError(400, 'Email already in use');
        }
      }

      // Check if username already exists (if provided)
      if (data.username) {
        const existingUsername = await prisma.user.findUnique({
          where: { username: data.username },
        });

        if (existingUsername) {
          throw new AppError(400, 'Username already in use');
        }
      }

      // Check if branch exists and belongs to the same company
      if (data.branchId) {
        const branch = await prisma.branch.findFirst({
          where: {
            id: data.branchId,
            companyId: data.companyId,
          },
        });

        if (!branch) {
          throw new AppError(400, 'Branch not found or does not belong to your company');
        }
      }

      // Check if custom role exists and belongs to the same company
      if (data.customRoleId) {
        const customRole = await prisma.role.findFirst({
          where: {
            id: data.customRoleId,
            companyId: data.companyId,
          },
        });

        if (!customRole) {
          throw new AppError(400, 'Custom role not found or does not belong to your company');
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create employee
      const employee = await prisma.user.create({
        data: {
          email: data.email ?? null,
          username: data.username ?? null,
          password: hashedPassword,
          name: data.name,
          phone: data.phone ?? null,
          profileImage: data.profileImage ?? null,
          role: data.role,
          roleId: data.roleId ?? data.customRoleId ?? null,
          customRoleId: data.customRoleId ?? null,
          companyId: data.companyId,
          branchId: data.branchId ?? null,
          isActive: data.isActive ?? true,
        },
        include: {
          company: {
            select: { id: true, name: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
          customRole: {
            select: { id: true, name: true },
          },
        },
      });

      // Remove password from response
      const { password: _, ...employeeWithoutPassword } = employee;

      Logger.info('Employee created successfully', { employeeId: employee.id });

      return employeeWithoutPassword;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating employee', { error });
      throw new AppError(500, 'Failed to create employee');
    }
  }

  /**
   * Get all employees with filters and pagination
   */
  static async getAllEmployees(
    filters: EmployeeFilters,
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
          { email: { contains: filters.search, mode: 'insensitive' } },
          { username: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.role) {
        where.role = filters.role;
      }

      if (filters.branchId) {
        where.branchId = filters.branchId;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const [employees, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            phone: true,
            profileImage: true,
            role: true,
            customRoleId: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            company: {
              select: { id: true, name: true },
            },
            branch: {
              select: { id: true, name: true, code: true },
            },
            customRole: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        employees,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching employees', { error });
      throw new AppError(500, 'Failed to fetch employees');
    }
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string, companyId: string) {
    try {
      const employee = await prisma.user.findFirst({
        where: {
          id,
          companyId,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          phone: true,
          role: true,
          customRoleId: true,
          isActive: true,
          lastLoginAt: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: { id: true, name: true },
          },
          branch: {
            select: { id: true, name: true, code: true, address: true },
          },
          customRole: {
            select: {
              id: true,
              name: true,
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
          managedBranches: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      if (!employee) {
        throw new AppError(404, 'Employee not found');
      }

      return employee;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching employee', { error, employeeId: id });
      throw new AppError(500, 'Failed to fetch employee');
    }
  }

  /**
   * Update employee
   */
  static async updateEmployee(id: string, companyId: string, data: UpdateEmployeeData) {
    try {
      // Check if employee exists and belongs to company
      const existingEmployee = await prisma.user.findFirst({
        where: { id, companyId },
      });

      if (!existingEmployee) {
        throw new AppError(404, 'Employee not found');
      }

      // Check if new email already exists (if email is being updated)
      if (data.email && data.email !== existingEmployee.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (emailExists) {
          throw new AppError(400, 'Email already in use');
        }
      }

      // Check if new username already exists (if username is being updated)
      if (data.username && data.username !== existingEmployee.username) {
        const usernameExists = await prisma.user.findUnique({
          where: { username: data.username },
        });

        if (usernameExists) {
          throw new AppError(400, 'Username already in use');
        }
      }

      // Check if branch exists and belongs to the same company
      if (data.branchId !== undefined && data.branchId !== null) {
        const branch = await prisma.branch.findFirst({
          where: {
            id: data.branchId,
            companyId,
          },
        });

        if (!branch) {
          throw new AppError(400, 'Branch not found or does not belong to your company');
        }
      }

      // Check if custom role exists and belongs to the same company
      if (data.customRoleId !== undefined && data.customRoleId !== null) {
        const customRole = await prisma.role.findFirst({
          where: {
            id: data.customRoleId,
            companyId,
          },
        });

        if (!customRole) {
          throw new AppError(400, 'Custom role not found or does not belong to your company');
        }
      }

      // Hash password if provided
      let hashedPassword: string | undefined;
      if (data.password) {
        hashedPassword = await hashPassword(data.password);
      }

      // Handle profile image update - delete old image if new one is provided
      if (data.profileImage !== undefined && existingEmployee.profileImage) {
        FileUtils.deleteFile(existingEmployee.profileImage);
      }

      const updatedEmployee = await prisma.user.update({
        where: { id },
        data: {
          ...(data.email !== undefined && { email: data.email || null }),
          ...(data.username !== undefined && { username: data.username || null }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(data.name && { name: data.name }),
          ...(data.phone !== undefined && { phone: data.phone || null }),
          ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
          ...(data.role && { role: data.role }),
          ...(data.roleId !== undefined && { roleId: data.roleId || null }),
          ...(data.customRoleId !== undefined && { customRoleId: data.customRoleId || null }),
          ...(data.branchId !== undefined && { branchId: data.branchId || null }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          phone: true,
          role: true,
          customRoleId: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: { id: true, name: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
          customRole: {
            select: { id: true, name: true },
          },
        },
      });

      Logger.info('Employee updated successfully', { employeeId: id });

      return updatedEmployee;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating employee', { error, employeeId: id });
      throw new AppError(500, 'Failed to update employee');
    }
  }

  /**
   * Delete employee
   */
  static async deleteEmployee(id: string, companyId: string) {
    try {
      // Check if employee exists and belongs to company
      const employee = await prisma.user.findFirst({
        where: { id, companyId },
        include: {
          _count: {
            select: {
              managedBranches: true,
              assignedServices: true,
            },
          },
        },
      });

      if (!employee) {
        throw new AppError(404, 'Employee not found');
      }

      // Check if employee manages branches
      if (employee._count.managedBranches > 0) {
        throw new AppError(
          400,
          'Cannot delete employee who manages branches. Please reassign branch managers first.'
        );
      }

      // Check if employee has assigned services
      if (employee._count.assignedServices > 0) {
        throw new AppError(
          400,
          'Cannot delete employee with assigned services. Please reassign services first.'
        );
      }

      // Delete profile image if exists
      if (employee.profileImage) {
        FileUtils.deleteFile(employee.profileImage);
      }

      await prisma.user.delete({
        where: { id },
      });

      Logger.info('Employee deleted successfully', { employeeId: id });

      return { message: 'Employee deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deleting employee', { error, employeeId: id });
      throw new AppError(500, 'Failed to delete employee');
    }
  }

  /**
   * Get employees by role (simplified list for dropdowns)
   */
  static async getEmployeesByRole(companyId: string, role?: UserRole) {
    try {
      const where: any = {
        companyId,
        isActive: true,
      };

      if (role) {
        where.role = role;
      }

      const employees = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: { name: 'asc' },
      });

      return employees;
    } catch (error) {
      Logger.error('Error fetching employees by role', { error, companyId, role });
      throw new AppError(500, 'Failed to fetch employees by role');
    }
  }

  /**
   * Check if username is available
   */
  static async checkUsernameAvailability(username: string, excludeUserId?: string) {
    try {
      if (!username || username.trim().length === 0) {
        return false;
      }

      const where: any = {
        username: username.trim(),
      };

      // If excludeUserId is provided, exclude that user from the check (for edit scenarios)
      if (excludeUserId) {
        where.id = { not: excludeUserId };
      }

      const existingUser = await prisma.user.findFirst({
        where,
      });

      return !existingUser; // Return true if no user found (username is available)
    } catch (error) {
      Logger.error('Error checking username availability', { error, username });
      throw new AppError(500, 'Failed to check username availability');
    }
  }

  /**
   * Add an existing employee to a branch
   */
  static async addEmployeeToBranch(userId: string, branchId: string, companyId: string) {
    try {
      // Check if employee exists and belongs to company
      const employee = await prisma.user.findFirst({
        where: { id: userId, companyId },
      });

      if (!employee) {
        throw new AppError(404, 'Employee not found');
      }

      // Check if employee is already assigned to a branch
      if (employee.branchId) {
        throw new AppError(
          400,
          'Employee is already assigned to a branch. Use transfer instead.'
        );
      }

      // Check if branch exists and belongs to company
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, companyId },
      });

      if (!branch) {
        throw new AppError(404, 'Branch not found');
      }

      const updatedEmployee = await prisma.user.update({
        where: { id: userId },
        data: { branchId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      Logger.info('Employee added to branch', { userId, branchId });

      return updatedEmployee;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error adding employee to branch', { error, userId, branchId });
      throw new AppError(500, 'Failed to add employee to branch');
    }
  }

  /**
   * Transfer employee from one branch to another
   */
  static async transferEmployee(userId: string, newBranchId: string, companyId: string) {
    try {
      // Check if employee exists and belongs to company
      const employee = await prisma.user.findFirst({
        where: { id: userId, companyId },
        include: {
          branch: {
            select: { id: true, name: true },
          },
        },
      });

      if (!employee) {
        throw new AppError(404, 'Employee not found');
      }

      // Check if new branch exists and belongs to company
      const newBranch = await prisma.branch.findFirst({
        where: { id: newBranchId, companyId },
      });

      if (!newBranch) {
        throw new AppError(404, 'Target branch not found');
      }

      // Check if employee is currently managing a branch
      const managedBranch = await prisma.branch.findFirst({
        where: { managerId: userId },
      });

      if (managedBranch) {
        throw new AppError(
          400,
          'Employee is currently managing a branch. Please reassign the branch manager first.'
        );
      }

      const oldBranchName = employee.branch?.name || 'No branch';

      const updatedEmployee = await prisma.user.update({
        where: { id: userId },
        data: { branchId: newBranchId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      Logger.info('Employee transferred to new branch', {
        userId,
        oldBranch: oldBranchName,
        newBranchId,
      });

      return {
        employee: updatedEmployee,
        message: `Employee transferred from "${oldBranchName}" to "${newBranch.name}"`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error transferring employee', { error, userId, newBranchId });
      throw new AppError(500, 'Failed to transfer employee');
    }
  }

  /**
   * Remove employee from their current branch
   */
  static async removeEmployeeFromBranch(userId: string, companyId: string) {
    try {
      // Check if employee exists and belongs to company
      const employee = await prisma.user.findFirst({
        where: { id: userId, companyId },
        include: {
          branch: {
            select: { id: true, name: true },
          },
        },
      });

      if (!employee) {
        throw new AppError(404, 'Employee not found');
      }

      if (!employee.branchId) {
        throw new AppError(400, 'Employee is not assigned to any branch');
      }

      // Check if employee is currently managing a branch
      const managedBranch = await prisma.branch.findFirst({
        where: { managerId: userId },
      });

      if (managedBranch) {
        throw new AppError(
          400,
          'Employee is currently managing a branch. Please reassign the branch manager first.'
        );
      }

      const branchName = employee.branch?.name || 'Unknown';

      const updatedEmployee = await prisma.user.update({
        where: { id: userId },
        data: { branchId: null },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      });

      Logger.info('Employee removed from branch', { userId, branchId: employee.branchId });

      return {
        employee: updatedEmployee,
        message: `Employee removed from "${branchName}"`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error removing employee from branch', { error, userId });
      throw new AppError(500, 'Failed to remove employee from branch');
    }
  }
}
