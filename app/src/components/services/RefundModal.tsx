import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { serviceApi } from '@/services/serviceApi';
import { masterDataApi } from '@/services/masterDataApi';
import { toast } from 'sonner';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  totalPaid: number;
  onSuccess?: () => void;
}

export default function RefundModal({
  isOpen,
  onClose,
  serviceId,
  totalPaid,
  onSuccess,
}: RefundModalProps) {
  const [formData, setFormData] = useState({
    reason: '',
    paymentMethodId: '',
  });
  const queryClient = useQueryClient();

  // Fetch payment methods
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => masterDataApi.paymentMethods.getAll({ limit: 100, isActive: true }),
    enabled: isOpen,
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      serviceApi.processRefund(serviceId, {
        reason: formData.reason,
        paymentMethodId: formData.paymentMethodId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Refund processed successfully');
      resetForm();
      onClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    },
  });

  const resetForm = () => {
    setFormData({
      reason: '',
      paymentMethodId: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      toast.error('Please enter a reason for the refund');
      return;
    }

    if (!formData.paymentMethodId) {
      toast.error('Please select a payment method');
      return;
    }

    refundMutation.mutate();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Process Refund</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Refund Amount Display */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-1">Refund Amount</p>
            <p className="text-2xl font-bold text-red-700">{totalPaid.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
            <p className="text-xs text-red-500 mt-1">This amount will be returned to customer</p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Refund <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Why is this service being refunded?"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.paymentMethodId}
              onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Select how refund will be given</option>
              {paymentMethodsData?.data.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">How will the refund be given to the customer?</p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Warning:</strong> This action will cancel the service and record the refund.
              This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={refundMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {refundMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Refund'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
