import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, Task, TaskStatus } from '@/services/taskApi';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Check,
  Calendar,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [TaskStatus.OVERDUE]: 'bg-red-100 text-red-800 border-red-200',
  [TaskStatus.CANCELLED]: 'bg-gray-100 text-gray-800 border-gray-200',
};

const PRIORITY_BADGES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

export default function MyTasks() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');

  // Fetch my tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['my-tasks', statusFilter],
    queryFn: () => taskApi.getMyTasks(statusFilter || undefined),
  });

  // Fetch task stats
  const { data: stats } = useQuery({
    queryKey: ['task-stats'],
    queryFn: taskApi.getTaskStats,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskApi.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast.success('Task status updated');
    },
    onError: () => {
      toast.error('Failed to update task status');
    },
  });

  const handleStartTask = (task: Task) => {
    updateStatusMutation.mutate({ id: task.id, status: TaskStatus.IN_PROGRESS });
  };

  const handleCompleteTask = (task: Task) => {
    updateStatusMutation.mutate({ id: task.id, status: TaskStatus.COMPLETED });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isOverdue = (task: Task) => {
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return false;
    return new Date(task.dueDate) < new Date();
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Group tasks by status
  const pendingTasks = tasks?.filter((t) => t.status === TaskStatus.PENDING) || [];
  const inProgressTasks = tasks?.filter((t) => t.status === TaskStatus.IN_PROGRESS) || [];
  const completedTasks = tasks?.filter((t) => t.status === TaskStatus.COMPLETED) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6" />
          My Tasks
        </h1>
        <p className="text-gray-500 mt-1">View and manage your assigned tasks</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setStatusFilter('')}
            className={`bg-white rounded-lg border p-4 text-left hover:border-gray-400 transition-colors ${
              statusFilter === '' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="text-sm text-gray-500">All Tasks</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </button>
          <button
            onClick={() => setStatusFilter(TaskStatus.PENDING)}
            className={`bg-white rounded-lg border p-4 text-left hover:border-yellow-400 transition-colors ${
              statusFilter === TaskStatus.PENDING ? 'ring-2 ring-yellow-500' : ''
            }`}
          >
            <div className="text-sm text-yellow-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Pending
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </button>
          <button
            onClick={() => setStatusFilter(TaskStatus.IN_PROGRESS)}
            className={`bg-white rounded-lg border p-4 text-left hover:border-blue-400 transition-colors ${
              statusFilter === TaskStatus.IN_PROGRESS ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="text-sm text-blue-600 flex items-center gap-1">
              <Play className="w-4 h-4" />
              In Progress
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </button>
          <button
            onClick={() => setStatusFilter(TaskStatus.COMPLETED)}
            className={`bg-white rounded-lg border p-4 text-left hover:border-green-400 transition-colors ${
              statusFilter === TaskStatus.COMPLETED ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <div className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Completed
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </button>
        </div>
      )}

      {/* Overdue Warning */}
      {stats && stats.overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <div className="font-medium text-red-800">
              You have {stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''}
            </div>
            <div className="text-sm text-red-600">Please complete them as soon as possible</div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {isLoading ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          Loading tasks...
        </div>
      ) : !tasks?.length ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const daysRemaining = getDaysRemaining(task.dueDate);
            const overdue = isOverdue(task);

            return (
              <div
                key={task.id}
                className={`bg-white rounded-lg border p-4 ${
                  overdue ? 'border-red-300 bg-red-50' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Task Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${PRIORITY_BADGES[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {formatDate(task.dueDate)}
                        {!overdue && task.status !== TaskStatus.COMPLETED && daysRemaining <= 3 && daysRemaining >= 0 && (
                          <span className="text-orange-600 font-medium">
                            ({daysRemaining === 0 ? 'Today' : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left`})
                          </span>
                        )}
                        {overdue && (
                          <span className="text-red-600 font-medium">(Overdue)</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        From: {task.createdBy?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${STATUS_COLORS[task.status]}`}>
                      {task.status.replace('_', ' ')}
                    </span>

                    {/* Action Buttons */}
                    {task.status === TaskStatus.PENDING && (
                      <button
                        onClick={() => handleStartTask(task)}
                        disabled={updateStatusMutation.isPending}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Play className="w-4 h-4" />
                        Start
                      </button>
                    )}
                    {task.status === TaskStatus.IN_PROGRESS && (
                      <button
                        onClick={() => handleCompleteTask(task)}
                        disabled={updateStatusMutation.isPending}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {task.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 uppercase font-medium mb-1">Notes</div>
                    <p className="text-sm text-gray-600">{task.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
