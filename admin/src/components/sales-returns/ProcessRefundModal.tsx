import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, AlertTriangle, Loader2, DollarSign } from 'lucide-react';
import { salesReturnApi } from '@/services/salesReturnApi';
import { masterDataApi } from '@/services/masterDataApi';
import { useAuthStore } from '@/store/authStore';
import type { SalesReturn } from '@/types';
import { toast } from 'sonner';

interface ProcessRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesReturn: SalesReturn;
  onSuccess: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function ProcessRefundModal({
  isOpen,
  onClose,
  salesReturn,
  onSuccess,
}: ProcessRefundModalProps) {
  const user = useAuthStore((state) => state.user);
  const branchId = user?.activeBranch?.id;

  const [formData, setFormData] = useState({
    paymentMethodId: '',
    referenceNumber: '',
    notes: '',
  });

  // Fetch payment methods
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => masterDataApi.paymentMethods.getAll({ limit: 100, isActive: true }),
    enabled: isOpen,
  });

  // Process refund mutation
  const refundMutation = useMutation({
    mutationFn: () =>
      salesReturnApi.processRefund(
        salesReturn.id,
        {
          paymentMethodId: formData.paymentMethodId || undefined,
          referenceNumber: formData.referenceNumber || undefined,
          notes: formData.notes || undefined,
        },
        branchId
      ),
    onSuccess: () => {
      toast.success('Refund processed successfully!');
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to process refund');
    },
  });

  const resetForm = () => {
    setFormData({
      paymentMethodId: '',
      referenceNumber: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Process Refund</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Return Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Return Number</span>
              <span className="text-sm font-medium text-orange-600">{salesReturn.returnNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Customer</span>
              <span className="text-sm font-medium text-gray-900">
                {salesReturn.customer?.name || 'N/A'}
              </span>
            </div>
          </div>

          {/* Refund Amount Display */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">Refund Amount</p>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(Number(salesReturn.totalReturnAmount))}
            </p>
            <p className="text-xs text-green-500 mt-1">This amount will be returned to customer</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.paymentMethodId}
              onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Transaction ID or Reference"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Any additional notes about this refund"
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">
                <strong>Important:</strong> This will mark the refund as processed and update the
                invoice paid amount. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Actions */}
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
