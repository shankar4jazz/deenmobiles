import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { BranchFormData } from '@/types';
import { branchApi } from '@/services/branchApi';
import { Loader2, AlertTriangle } from 'lucide-react';

interface BranchFormProps {
  initialData?: Partial<BranchFormData>;
  onSubmit: (data: BranchFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function BranchForm({
  initialData,
  onSubmit,
  isLoading = false,
}: BranchFormProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingManagerId, setPendingManagerId] = useState<string | null>(null);
  const [selectedManagerInfo, setSelectedManagerInfo] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BranchFormData>({
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      address: initialData?.address || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      managerId: initialData?.managerId || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const currentManagerId = watch('managerId');

  // Fetch available managers
  const { data: managers = [] } = useQuery({
    queryKey: ['availableManagers'],
    queryFn: branchApi.getAvailableManagers,
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Handle manager selection with confirmation
  const handleManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newManagerId = e.target.value;

    if (!newManagerId) {
      setValue('managerId', '');
      return;
    }

    const manager = managers.find((m: any) => m.id === newManagerId);

    // Check if manager is already managing another branch
    if (manager && manager.managingBranches && manager.managingBranches.length > 0) {
      // Check if they're managing a different branch (not the current one being edited)
      const managingOtherBranch = manager.managingBranches.some(
        (branch: any) => branch.id !== initialData?.id
      );

      if (managingOtherBranch) {
        // Show confirmation dialog
        setPendingManagerId(newManagerId);
        setSelectedManagerInfo(manager);
        setShowConfirmDialog(true);
        return;
      }
    }

    // No conflict, set directly
    setValue('managerId', newManagerId);
  };

  const confirmManagerReassignment = () => {
    if (pendingManagerId) {
      setValue('managerId', pendingManagerId);
    }
    setShowConfirmDialog(false);
    setPendingManagerId(null);
    setSelectedManagerInfo(null);
  };

  const cancelManagerReassignment = () => {
    setShowConfirmDialog(false);
    setPendingManagerId(null);
    setSelectedManagerInfo(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branch Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Branch Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            {...register('name', {
              required: 'Branch name is required',
              minLength: {
                value: 2,
                message: 'Branch name must be at least 2 characters',
              },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter branch name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Branch Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Branch Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="code"
            {...register('code', {
              required: 'Branch code is required',
              pattern: {
                value: /^[A-Z0-9_-]+$/,
                message: 'Code must be uppercase letters, numbers, hyphens, or underscores',
              },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
            placeholder="e.g., BR001"
            disabled={!!initialData?.code}
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
          )}
          {initialData?.code && (
            <p className="mt-1 text-xs text-gray-500">Branch code cannot be changed</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="branch@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            {...register('phone', {
              required: 'Phone number is required',
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="+1234567890"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Manager */}
        <div>
          <label htmlFor="managerId" className="block text-sm font-medium text-gray-700 mb-2">
            Branch Manager
          </label>
          <select
            id="managerId"
            value={currentManagerId || ''}
            onChange={handleManagerChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">No Manager Assigned</option>
            {managers.map((manager: any) => {
              const isManagingOther = manager.managingBranches && manager.managingBranches.length > 0;
              const managedBranchNames = manager.managingBranches
                ?.map((b: any) => b.name)
                .join(', ');

              return (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.role})
                  {isManagingOther ? ` - Currently managing: ${managedBranchNames}` : ''}
                  {manager.assignedToBranchName ? ` - Works at: ${manager.assignedToBranchName}` : ''}
                </option>
              );
            })}
          </select>

          {/* Manager Assignment Info */}
          {currentManagerId && managers.find((m: any) => m.id === currentManagerId) && (
            <div className="mt-2">
              {(() => {
                const selectedManager = managers.find((m: any) => m.id === currentManagerId);
                if (!selectedManager) return null;

                const badges = [];

                if (selectedManager.managingBranches && selectedManager.managingBranches.length > 0) {
                  badges.push(
                    <span key="managing" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Managing: {selectedManager.managingBranches.map((b: any) => b.name).join(', ')}
                    </span>
                  );
                }

                if (selectedManager.assignedToBranchName) {
                  badges.push(
                    <span key="works-at" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Works at: {selectedManager.assignedToBranchName}
                    </span>
                  );
                }

                if (badges.length === 0) {
                  badges.push(
                    <span key="available" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  );
                }

                return <div className="flex flex-wrap gap-2">{badges}</div>;
              })()}
            </div>
          )}
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            {...register('isActive')}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
          />
          <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
            Active Branch
          </label>
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          Address <span className="text-red-500">*</span>
        </label>
        <textarea
          id="address"
          {...register('address', {
            required: 'Address is required',
            minLength: {
              value: 5,
              message: 'Address must be at least 5 characters',
            },
          })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter complete address"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
          {isLoading ? 'Saving...' : initialData ? 'Update Branch' : 'Create Branch'}
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedManagerInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Manager Reassignment Warning
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedManagerInfo.name} is currently managing:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 mb-4">
                  {selectedManagerInfo.managingBranches.map((branch: any) => (
                    <li key={branch.id}>
                      {branch.name} ({branch.code})
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-600 mb-4">
                  Assigning them as manager of this branch will automatically remove them as manager from their current branch(es).
                  The old branch(es) will have no manager until you assign a new one.
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Do you want to continue?
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelManagerReassignment}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmManagerReassignment}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Yes, Reassign Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
