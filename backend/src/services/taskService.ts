import prisma from '../config/database';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedToId: string;
  dueDate: Date;
  notes?: string;
  companyId: string;
  branchId: string;
  createdById: string;
}

interface BulkCreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeIds: string[];
  dueDate: Date;
  notes?: string;
  companyId: string;
  branchId: string;
  createdById: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  notes?: string;
  assignedToId?: string;
}

interface TaskFilters {
  companyId: string;
  branchId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  createdById?: string;
  search?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  page?: number;
  limit?: number;
}

export class TaskService {
  /**
   * Generate task number
   */
  private static async generateTaskNumber(branchId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // Get branch code
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });

    const branchCode = branch?.code || '1';

    // Count today's tasks for this branch
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await prisma.task.count({
      where: {
        branchId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(count + 1).padStart(3, '0');
    return `TSK-${branchCode}-${year}${month}${day}-${sequence}`;
  }

  /**
   * Create a single task
   */
  static async createTask(data: CreateTaskData) {
    try {
      // Verify assignee exists and belongs to the same branch
      const assignee = await prisma.user.findFirst({
        where: {
          id: data.assignedToId,
          companyId: data.companyId,
          branchId: data.branchId,
          isActive: true,
        },
      });

      if (!assignee) {
        throw new AppError(404, 'Assignee not found or not in this branch');
      }

      const taskNumber = await this.generateTaskNumber(data.branchId);

      const task = await prisma.task.create({
        data: {
          taskNumber,
          title: data.title,
          description: data.description,
          priority: data.priority || TaskPriority.MEDIUM,
          assignedToId: data.assignedToId,
          createdById: data.createdById,
          companyId: data.companyId,
          branchId: data.branchId,
          dueDate: data.dueDate,
          notes: data.notes,
          status: TaskStatus.PENDING,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      // Create in-app notification for assignee
      await prisma.notification.create({
        data: {
          userId: data.assignedToId,
          title: 'New Task Assigned',
          message: `You have been assigned a new task: ${data.title}`,
        },
      });

      Logger.info('Task created', { taskId: task.id, assignedTo: data.assignedToId });

      return task;
    } catch (error) {
      Logger.error('Error creating task', { error, data });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to create task');
    }
  }

  /**
   * Create multiple tasks for different assignees (bulk creation)
   */
  static async createBulkTasks(data: BulkCreateTaskData) {
    try {
      const batchId = uuidv4();
      const tasks = [];

      // Verify all assignees exist and belong to the same branch
      const assignees = await prisma.user.findMany({
        where: {
          id: { in: data.assigneeIds },
          companyId: data.companyId,
          branchId: data.branchId,
          isActive: true,
        },
      });

      if (assignees.length !== data.assigneeIds.length) {
        throw new AppError(400, 'Some assignees not found or not in this branch');
      }

      // Create tasks in a transaction
      const createdTasks = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const assigneeId of data.assigneeIds) {
          const taskNumber = await this.generateTaskNumber(data.branchId);

          const task = await tx.task.create({
            data: {
              taskNumber,
              title: data.title,
              description: data.description,
              priority: data.priority || TaskPriority.MEDIUM,
              assignedToId: assigneeId,
              createdById: data.createdById,
              companyId: data.companyId,
              branchId: data.branchId,
              dueDate: data.dueDate,
              notes: data.notes,
              status: TaskStatus.PENDING,
              batchId,
            },
            include: {
              assignedTo: {
                select: { id: true, name: true, email: true, role: true },
              },
              createdBy: {
                select: { id: true, name: true },
              },
            },
          });

          // Create notification for each assignee
          await tx.notification.create({
            data: {
              userId: assigneeId,
              title: 'New Task Assigned',
              message: `You have been assigned a new task: ${data.title}`,
            },
          });

          results.push(task);
        }

        return results;
      });

      Logger.info('Bulk tasks created', {
        batchId,
        count: createdTasks.length,
        assignees: data.assigneeIds
      });

      return { batchId, tasks: createdTasks };
    } catch (error) {
      Logger.error('Error creating bulk tasks', { error, data });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to create bulk tasks');
    }
  }

  /**
   * Get all tasks with filters
   */
  static async getTasks(filters: TaskFilters) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {
        companyId: filters.companyId,
      };

      if (filters.branchId) {
        where.branchId = filters.branchId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.assignedToId) {
        where.assignedToId = filters.assignedToId;
      }

      if (filters.createdById) {
        where.createdById = filters.createdById;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { taskNumber: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.dueBefore) {
        where.dueDate = { ...where.dueDate, lte: filters.dueBefore };
      }

      if (filters.dueAfter) {
        where.dueDate = { ...where.dueDate, gte: filters.dueAfter };
      }

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, role: true },
            },
            createdBy: {
              select: { id: true, name: true },
            },
            branch: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: [
            { dueDate: 'asc' },
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.task.count({ where }),
      ]);

      return {
        data: tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching tasks', { error, filters });
      throw new AppError(500, 'Failed to fetch tasks');
    }
  }

  /**
   * Get tasks assigned to a specific user
   */
  static async getMyTasks(userId: string, companyId: string, status?: TaskStatus) {
    try {
      const where: any = {
        assignedToId: userId,
        companyId,
      };

      if (status) {
        where.status = status;
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          branch: {
            select: { id: true, name: true },
          },
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { priority: 'desc' },
        ],
      });

      return tasks;
    } catch (error) {
      Logger.error('Error fetching my tasks', { error, userId });
      throw new AppError(500, 'Failed to fetch tasks');
    }
  }

  /**
   * Get task by ID
   */
  static async getTaskById(taskId: string, companyId: string) {
    try {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          companyId,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      if (!task) {
        throw new AppError(404, 'Task not found');
      }

      return task;
    } catch (error) {
      Logger.error('Error fetching task', { error, taskId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to fetch task');
    }
  }

  /**
   * Update task (admin/manager only)
   */
  static async updateTask(taskId: string, data: UpdateTaskData, companyId: string) {
    try {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          companyId,
        },
      });

      if (!task) {
        throw new AppError(404, 'Task not found');
      }

      // If changing assignee, verify they exist
      if (data.assignedToId && data.assignedToId !== task.assignedToId) {
        const assignee = await prisma.user.findFirst({
          where: {
            id: data.assignedToId,
            companyId,
            branchId: task.branchId,
            isActive: true,
          },
        });

        if (!assignee) {
          throw new AppError(404, 'New assignee not found or not in this branch');
        }
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          dueDate: data.dueDate,
          notes: data.notes,
          assignedToId: data.assignedToId,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      // If assignee changed, notify new assignee
      if (data.assignedToId && data.assignedToId !== task.assignedToId) {
        await prisma.notification.create({
          data: {
            userId: data.assignedToId,
            title: 'Task Reassigned',
            message: `You have been assigned a task: ${updatedTask.title}`,
          },
        });
      }

      Logger.info('Task updated', { taskId });

      return updatedTask;
    } catch (error) {
      Logger.error('Error updating task', { error, taskId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to update task');
    }
  }

  /**
   * Update task status (assignee can mark as in_progress or completed)
   */
  static async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    userId: string,
    companyId: string,
    isAdmin: boolean = false
  ) {
    try {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          companyId,
        },
      });

      if (!task) {
        throw new AppError(404, 'Task not found');
      }

      // Check if user is the assignee or admin/manager
      if (!isAdmin && task.assignedToId !== userId) {
        throw new AppError(403, 'You can only update status of tasks assigned to you');
      }

      const updateData: any = { status };

      // Set completedAt if marking as completed
      if (status === TaskStatus.COMPLETED) {
        updateData.completedAt = new Date();
      } else if (task.status === TaskStatus.COMPLETED) {
        // Clear completedAt if reopening
        updateData.completedAt = null;
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      });

      Logger.info('Task status updated', { taskId, status, updatedBy: userId });

      return updatedTask;
    } catch (error) {
      Logger.error('Error updating task status', { error, taskId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to update task status');
    }
  }

  /**
   * Delete task (admin/manager only)
   */
  static async deleteTask(taskId: string, companyId: string) {
    try {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          companyId,
        },
      });

      if (!task) {
        throw new AppError(404, 'Task not found');
      }

      await prisma.task.delete({
        where: { id: taskId },
      });

      Logger.info('Task deleted', { taskId });

      return { message: 'Task deleted successfully' };
    } catch (error) {
      Logger.error('Error deleting task', { error, taskId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to delete task');
    }
  }

  /**
   * Get task statistics for dashboard
   */
  static async getTaskStats(companyId: string, branchId?: string, userId?: string) {
    try {
      const where: any = { companyId };

      if (branchId) {
        where.branchId = branchId;
      }

      if (userId) {
        where.assignedToId = userId;
      }

      const [pending, inProgress, completed, overdue] = await Promise.all([
        prisma.task.count({ where: { ...where, status: TaskStatus.PENDING } }),
        prisma.task.count({ where: { ...where, status: TaskStatus.IN_PROGRESS } }),
        prisma.task.count({ where: { ...where, status: TaskStatus.COMPLETED } }),
        prisma.task.count({
          where: {
            ...where,
            status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
            dueDate: { lt: new Date() },
          }
        }),
      ]);

      return {
        pending,
        inProgress,
        completed,
        overdue,
        total: pending + inProgress + completed,
      };
    } catch (error) {
      Logger.error('Error fetching task stats', { error });
      throw new AppError(500, 'Failed to fetch task statistics');
    }
  }
}
