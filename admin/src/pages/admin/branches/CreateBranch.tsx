import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import BranchForm from '@/components/branches/BranchForm';
import { branchApi } from '@/services/branchApi';
import { BranchFormData } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function CreateBranch() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: branchApi.createBranch,
    onSuccess: () => {
      navigate('/branches');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create branch');
    },
  });

  const handleSubmit = async (data: BranchFormData) => {
    setError('');
    await createMutation.mutateAsync(data);
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Create New Branch</h1>
            <p className="text-gray-600 mt-1">Add a new service center branch</p>
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
          <BranchForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </div>
      </div>
    </>
  );
}
