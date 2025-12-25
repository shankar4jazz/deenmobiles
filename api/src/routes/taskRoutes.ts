import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { TaskController } from '../controllers/taskController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { body, param, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createTaskValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('assignedToId').isUUID().withMessage('Valid assignee ID is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
];

const createBulkTaskValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('assigneeIds').isArray({ min: 1 }).withMessage('At least one assignee is required'),
  body('assigneeIds.*').isUUID().withMessage('Valid assignee IDs are required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
];

const updateTaskValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('assignedToId').optional().isUUID().withMessage('Valid assignee ID is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
];

const updateStatusValidation = [
  body('status').isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
];

const taskIdValidation = [
  param('id').isUUID().withMessage('Invalid task ID format'),
];

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a single task
 * @access  Private (Admin, Manager)
 */
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  validate(createTaskValidation),
  TaskController.createTask
);

/**
 * @route   POST /api/v1/tasks/bulk
 * @desc    Create multiple tasks for different assignees
 * @access  Private (Admin, Manager)
 */
router.post(
  '/bulk',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  validate(createBulkTaskValidation),
  TaskController.createBulkTasks
);

/**
 * @route   GET /api/v1/tasks/my-tasks
 * @desc    Get tasks assigned to current user
 * @access  Private (All authenticated users)
 */
router.get(
  '/my-tasks',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TECHNICIAN,
    UserRole.RECEPTIONIST,
    UserRole.BRANCH_ADMIN,
    UserRole.SERVICE_ADMIN,
    UserRole.SERVICE_MANAGER,
    UserRole.CUSTOMER_SUPPORT
  ),
  TaskController.getMyTasks
);

/**
 * @route   GET /api/v1/tasks/stats
 * @desc    Get task statistics
 * @access  Private (All authenticated users)
 */
router.get(
  '/stats',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TECHNICIAN,
    UserRole.RECEPTIONIST,
    UserRole.BRANCH_ADMIN,
    UserRole.SERVICE_ADMIN,
    UserRole.SERVICE_MANAGER,
    UserRole.CUSTOMER_SUPPORT
  ),
  TaskController.getTaskStats
);

/**
 * @route   GET /api/v1/tasks
 * @desc    Get all tasks with filters
 * @access  Private (Admin, Manager)
 */
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TaskController.getAllTasks
);

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    Get task by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TECHNICIAN,
    UserRole.RECEPTIONIST,
    UserRole.BRANCH_ADMIN,
    UserRole.SERVICE_ADMIN,
    UserRole.SERVICE_MANAGER,
    UserRole.CUSTOMER_SUPPORT
  ),
  validate(taskIdValidation),
  TaskController.getTaskById
);

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    Update task
 * @access  Private (Admin, Manager)
 */
router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  validate([...taskIdValidation, ...updateTaskValidation]),
  TaskController.updateTask
);

/**
 * @route   PUT /api/v1/tasks/:id/status
 * @desc    Update task status
 * @access  Private (All authenticated users - but only own tasks)
 */
router.put(
  '/:id/status',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TECHNICIAN,
    UserRole.RECEPTIONIST,
    UserRole.BRANCH_ADMIN,
    UserRole.SERVICE_ADMIN,
    UserRole.SERVICE_MANAGER,
    UserRole.CUSTOMER_SUPPORT
  ),
  validate([...taskIdValidation, ...updateStatusValidation]),
  TaskController.updateTaskStatus
);

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete task
 * @access  Private (Admin, Manager)
 */
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  validate(taskIdValidation),
  TaskController.deleteTask
);

export default router;
