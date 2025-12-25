import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, CheckCircle } from 'lucide-react';
import { PettyCashRequest, ApprovePettyCashRequestDto } from '../../types/expense';
import { masterDataApi } from '../../services/masterDataApi';

interface ApproveRequestModalProps {
  request: PettyCashRequest;
  onClose: () => void;
  onApprove: (data: ApprovePettyCashRequestDto) => void;
  isSubmitting: boolean;
}

export default function ApproveRequestModal({
  request,
  onClose,
  onApprove,
  isSubmitting,
}: ApproveRequestModalProps) {
  const [formData, setFormData] = useState({
    paymentMethodId: '',
    transactionRef: '',
    bankDetails: '',
    purpose: `Approved request: ${request.requestNumber} - ${request.reason}`,
    remarks: '',
    proofUrl: '',
  });

  // Fetch payment methods
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => masterDataApi.paymentMethods.getAll({ limit: 100, isActive: true }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onApprove({
      paymentMethodId: formData.paymentMethodId || undefined,
      transactionRef: formData.transactionRef || undefined,
      bankDetails: formData.bankDetails || undefined,
      purpose: formData.purpose || undefined,
      remarks: formData.remarks || undefined,
      proofUrl: formData.proofUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Approve Request</h2>
              <p className="text-sm text-gray-600">Request #{request.requestNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Request Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Request Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Branch</p>
                <p className="font-medium text-gray-900">{request.branch.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Requested By</p>
                <p className="font-medium text-gray-900">{request.requestedByUser.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Amount</p>
                <p className="font-bold text-lg text-green-600">
                  ₹{Number(request.requestedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Reason</p>
                <p className="text-sm text-gray-900">{request.reason}</p>
              </div>
            </div>
          </div>

          {/* Approval Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethodId}
                onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select payment method (Optional)</option>
                {paymentMethodsData?.data.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Reference
              </label>
              <input
                type="text"
                value={formData.transactionRef}
                onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., CHQ123456, UPI/123456789"
              />
            </div>

            {/* Bank Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Details
              </label>
              <input
                type="text"
                value={formData.bankDetails}
                onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., HDFC Bank - A/c XXXX1234"
              />
            </div>

            {/* Purpose (Pre-filled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose
              </label>
              <textarea
                rows={3}
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                placeholder="Purpose of transfer..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be recorded as the transfer purpose
              </p>
            </div>

            {/* Proof URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proof / Receipt URL
              </label>
              <input
                type="url"
                value={formData.proofUrl}
                onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com/receipt.pdf"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                rows={2}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Any additional notes for approval..."
              />
            </div>

            {/* Warning Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">Approval Confirmation</p>
                  <p className="text-green-700 mt-1">
                    Approving this request will automatically create a petty cash transfer of{' '}
                    <span className="font-bold">
                      ₹{Number(request.requestedAmount).toLocaleString('en-IN')}
                    </span>{' '}
                    to <span className="font-bold">{request.branch.name}</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
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
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {isSubmitting ? 'Approving...' : 'Approve & Create Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
