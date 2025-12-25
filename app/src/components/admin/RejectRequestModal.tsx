import { useState } from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';
import { PettyCashRequest, RejectPettyCashRequestDto } from '../../types/expense';

interface RejectRequestModalProps {
  request: PettyCashRequest;
  onClose: () => void;
  onReject: (data: RejectPettyCashRequestDto) => void;
  isSubmitting: boolean;
}

export default function RejectRequestModal({
  request,
  onClose,
  onReject,
  isSubmitting,
}: RejectRequestModalProps) {
  const [rejectedReason, setRejectedReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rejectedReason || rejectedReason.trim().length < 10) {
      alert('Please provide a detailed rejection reason (at least 10 characters)');
      return;
    }

    onReject({
      rejectedReason: rejectedReason.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Reject Request</h2>
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
              <div className="col-span-2">
                <p className="text-xs text-gray-600">Amount</p>
                <p className="font-bold text-lg text-gray-900">
                  ₹{Number(request.requestedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-600 mb-1">Reason</p>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200">
                  {request.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rejection Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                minLength={10}
                maxLength={500}
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Please provide a clear reason for rejecting this request (minimum 10 characters)..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectedReason.length}/500 characters (minimum 10 required)
              </p>
            </div>

            {/* Warning Box */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Rejection Confirmation</p>
                  <p className="text-red-700 mt-1">
                    The request will be marked as rejected and the branch will be notified with your reason.
                    This action cannot be undone.
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                {isSubmitting ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
