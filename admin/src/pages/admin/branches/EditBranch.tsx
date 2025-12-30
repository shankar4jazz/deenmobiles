import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import BranchForm from '@/components/branches/BranchForm';
import { branchApi } from '@/services/branchApi';
import { BranchFormData } from '@/types';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditBranch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Fetch branch data
  const { data: branch, isLoading } = useQuery({
    queryKey: ['branch', id],
    queryFn: () => branchApi.getBranchById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: BranchFormData) => branchApi.updateBranch(id!, data),
    onSuccess: () => {
      navigate('/branches');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update branch');
    },
  });

  const handleSubmit = async (data: BranchFormData) => {
    setError('');
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
            <p className="text-gray-600">Loading branch details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!branch) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <p className="text-lg font-medium">Branch not found</p>
          <button
            onClick={() => navigate('/branches')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Branches
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/branches')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Branch</h1>
            <p className="text-gray-600 mt-1">Update branch information</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <BranchForm
            initialData={{
              name: branch.name,
              code: branch.code,
              address: branch.address,
              phone: branch.phone,
              email: branch.email,
              managerId: branch.managerId || '',
              isActive: branch.isActive,
            }}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
          />
        </div>
      </div>
    </>
  );
}
