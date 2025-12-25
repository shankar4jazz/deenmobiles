import { Response } from 'express';
import { TaskStatus, TaskPriority, UserRole } from '@prisma/client';
import { TaskService } from '../services/taskService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class TaskController {
  /**
   * POST /api/v1/tasks
   * Create a single task
   */
  static createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.user!.branchId;
    const createdById = req.user!.userId;

    const { title, description, priority, assignedToId, dueDate, notes } = req.body;

    const task = await TaskService.createTask({
      title,
      description,
      priority,
      assignedToId,
      dueDate: new Date(dueDate),
      notes,
      companyId,
      branchId: branchId!,
      createdById,
    });

    return ApiResponse.created(res, task, 'Task created successfully');
  });

  /**
   * POST /api/v1/tasks/bulk
   * Create multiple tasks for different assignees
   */
  static createBulkTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.user!.branchId;
    const createdById = req.user!.userId;

    const { title, description, priority, assigneeIds, dueDate, notes } = req.body;

    const result = await TaskService.createBulkTasks({
      title,
      description,
      priority,
      assigneeIds,
      dueDate: new Date(dueDate),
      notes,
      companyId,
      branchId: branchId!,
      createdById,
    });

    return ApiResponse.created(
      res,
      result,
      `${result.tasks.length} tasks created successfully`
    );
  });

  /**
   * GET /api/v1/tasks
   * Get all tasks with filters (admin/manager view)
   */
  static getAllTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.user!.branchId;

    const filters = {
      companyId,
      branchId: branchId || (req.query.branchId as string),
      status: req.query.status as TaskStatus,
      priority: req.query.priority as TaskPriority,
      assignedToId: req.query.assignedToId as string,
      search: req.query.search as string,
      dueBefore: req.query.dueBefore ? new Date(req.query.dueBefore as string) : undefined,
      dueAfter: req.query.dueAfter ? new Date(req.query.dueAfter as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await TaskService.getTasks(filters);

    return ApiResponse.success(res, result, 'Tasks retrieved successfully');
  });

  /**
   * GET /api/v1/tasks/my-tasks
   * Get tasks assigned to the current user
   */
  static getMyTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;
    const status = req.query.status as TaskStatus;

    const tasks = await TaskService.getMyTasks(userId, companyId, status);

    return ApiResponse.success(res, tasks, 'Tasks retrieved successfully');
  });

  /**
   * GET /api/v1/tasks/stats
   * Get task statistics
   */
  static getTaskStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.user!.branchId;
    const role = req.user!.role;

    // For non-admin users, only show their own stats
    const adminRoles: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN];
    const userId = adminRoles.includes(role as UserRole)
      ? undefined
      : req.user!.userId;

    const stats = await TaskService.getTaskStats(companyId, branchId || undefined, userId);

    return ApiResponse.success(res, stats, 'Task statistics retrieved successfully');
  });

  /**
   * GET /api/v1/tasks/:id
   * Get task by ID
   */
  static getTaskById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const task = await TaskService.getTaskById(id, companyId);

    return ApiResponse.success(res, task, 'Task retrieved successfully');
  });

  /**
   * PUT /api/v1/tasks/:id
   * Update task (admin/manager only)
   */
  static updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const { title, description, priority, dueDate, notes, assignedToId } = req.body;

    const task = await TaskService.updateTask(
      id,
      {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        assignedToId,
      },
      companyId
    );

    return ApiResponse.success(res, task, 'Task updated successfully');
  });

  /**
   * PUT /api/v1/tasks/:id/status
   * Update task status (assignee can update their own task status)
   */
  static updateTaskStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;
    const role = req.user!.role;

    const adminRoles: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN];
    const isAdmin = adminRoles.includes(role as UserRole);

    const task = await TaskService.updateTaskStatus(id, status, userId, companyId, isAdmin);

    return ApiResponse.success(res, task, 'Task status updated successfully');
  });

  /**
   * DELETE /api/v1/tasks/:id
   * Delete task (admin/manager only)
   */
  static deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    await TaskService.deleteTask(id, companyId);

    return ApiResponse.success(res, null, 'Task deleted successfully');
  });
}
