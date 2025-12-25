import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Users, Check } from 'lucide-react';
import { taskApi, TaskPriority, BulkCreateTaskData } from '@/services/taskApi';
import { employeeApi } from '@/services/employeeApi';
import { toast } from 'sonner';

interface BulkCreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkCreateTaskModal({ isOpen, onClose }: BulkCreateTaskModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-tasks'],
    queryFn: () => employeeApi.getEmployees({ limit: 100 }),
    enabled: isOpen,
  });

  // Filter staff (exclude super admin, admin, manager)
  const staffMembers = employeesData?.data?.filter((emp: any) =>
    ['TECHNICIAN', 'RECEPTIONIST', 'BRANCH_ADMIN', 'SERVICE_ADMIN', 'SERVICE_MANAGER', 'CUSTOMER_SUPPORT'].includes(emp.role)
  ) || [];

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority(TaskPriority.MEDIUM);
    setSelectedAssignees([]);
    setDueDate('');
    setNotes('');
  };

  // Bulk create mutation
  const bulkCreateMutation = useMutation({
    mutationFn: (data: BulkCreateTaskData) => taskApi.createBulkTasks(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast.success(`${result.tasks.length} tasks created successfully`);
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create tasks');
    },
  });

  const toggleAssignee = (id: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedAssignees.length === staffMembers.length) {
      setSelectedAssignees([]);
    } else {
      setSelectedAssignees(staffMembers.map((emp: any) => emp.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (selectedAssignees.length === 0) {
      toast.error('Please select at least one assignee');
      return;
    }

    if (!dueDate) {
      toast.error('Due date is required');
      return;
    }

    bulkCreateMutation.mutate({
      title,
      description: description || undefined,
      priority,
      assigneeIds: selectedAssignees,
      dueDate,
      notes: notes || undefined,
    });
  };

  // Get selected assignee names for preview
  const selectedNames = staffMembers
    .filter((emp: any) => selectedAssignees.includes(emp.id))
    .map((emp: any) => emp.name);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Bulk Create Tasks</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter task title (same for all assignees)"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter task description (optional)"
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
                <option value={TaskPriority.URGENT}>Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Assignees Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Assign To <span className="text-red-500">*</span>
                <span className="text-gray-500 ml-2">
                  ({selectedAssignees.length} selected)
                </span>
              </label>
              <button
                type="button"
                onClick={selectAll}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                {selectedAssignees.length === staffMembers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {staffMembers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No staff members found</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {staffMembers.map((emp: any) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          selectedAssignees.includes(emp.id)
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedAssignees.includes(emp.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(emp.id)}
                        onChange={() => toggleAssignee(emp.id)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-500">{emp.role}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Additional notes (optional)"
            />
          </div>

          {/* Preview */}
          {selectedAssignees.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-700">
                <strong>Preview:</strong> Will create {selectedAssignees.length} separate task
                {selectedAssignees.length > 1 ? 's' : ''} for:
              </div>
              <div className="text-sm text-purple-600 mt-1">
                {selectedNames.join(', ')}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bulkCreateMutation.isPending || selectedAssignees.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {bulkCreateMutation.isPending
                ? 'Creating...'
                : `Create ${selectedAssignees.length} Task${selectedAssignees.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
