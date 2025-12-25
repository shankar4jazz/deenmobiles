import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, DollarSign, Save } from 'lucide-react';
import { serviceApi } from '@/services/serviceApi';
import { toast } from 'sonner';

interface EditEstimatedCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  currentValue: number;
}

export default function EditEstimatedCostModal({
  isOpen,
  onClose,
  serviceId,
  currentValue,
}: EditEstimatedCostModalProps) {
  const [estimatedCost, setEstimatedCost] = useState<number>(currentValue);
  const queryClient = useQueryClient();

  useEffect(() => {
    setEstimatedCost(currentValue);
  }, [currentValue, isOpen]);

  const updateMutation = useMutation({
    mutationFn: () => serviceApi.updateEstimatedCost(serviceId, estimatedCost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      toast.success('Estimated cost updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update estimated cost');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (estimatedCost < 0) {
      toast.error('Estimated cost cannot be negative');
      return;
    }
    updateMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Edit Estimated Cost</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Cost
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
