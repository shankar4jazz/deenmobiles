import { api } from './api';

// Task Types
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Task {
  id: string;
  taskNumber: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string;
  assignedTo?: {
    id: string;
    name: string;
    email?: string;
    role: string;
  };
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
  };
  companyId: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  dueDate: string;
  completedAt?: string;
  batchId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedToId: string;
  dueDate: string;
  notes?: string;
}

export interface BulkCreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeIds: string[];
  dueDate: string;
  notes?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assignedToId?: string;
  dueDate?: string;
  notes?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
  page?: number;
  limit?: number;
}

export interface TaskStats {
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkCreateResponse {
  batchId: string;
  tasks: Task[];
}

// Task API endpoints
export const taskApi = {
  // Create a single task
  createTask: async (data: CreateTaskData): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data.data;
  },

  // Create multiple tasks for different assignees
  createBulkTasks: async (data: BulkCreateTaskData): Promise<BulkCreateResponse> => {
    const response = await api.post('/tasks/bulk', data);
    return response.data.data;
  },

  // Get all tasks with filters (admin/manager)
  getTasks: async (filters?: TaskFilters): Promise<PaginatedResponse<Task>> => {
    const response = await api.get('/tasks', { params: filters });
    return response.data.data;
  },

  // Get tasks assigned to current user
  getMyTasks: async (status?: TaskStatus): Promise<Task[]> => {
    const response = await api.get('/tasks/my-tasks', { params: { status } });
    return response.data.data;
  },

  // Get task statistics
  getTaskStats: async (): Promise<TaskStats> => {
    const response = await api.get('/tasks/stats');
    return response.data.data;
  },

  // Get task by ID
  getTaskById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },

  // Update task (admin/manager)
  updateTask: async (id: string, data: UpdateTaskData): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data.data;
  },

  // Update task status
  updateTaskStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const response = await api.put(`/tasks/${id}/status`, { status });
    return response.data.data;
  },

  // Delete task (admin/manager)
  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};
