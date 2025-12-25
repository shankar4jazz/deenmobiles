import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { PettyCashTransfer, CreatePettyCashTransferDto, UpdatePettyCashTransferDto } from '../../types/expense';
import { branchApi } from '../../services/branchApi';
import { masterDataApi } from '../../services/masterDataApi';

interface TransferFormModalProps {
  transfer: PettyCashTransfer | null;
  onClose: () => void;
  onSubmit: (data: CreatePettyCashTransferDto | UpdatePettyCashTransferDto) => void;
  isSubmitting: boolean;
}

export default function TransferFormModal({
  transfer,
  onClose,
  onSubmit,
  isSubmitting,
}: TransferFormModalProps) {
  const [formData, setFormData] = useState({
    branchId: transfer?.branchId || '',
    amount: transfer?.amount ? String(transfer.amount) : '',
    transferDate: transfer?.transferDate
      ? format(new Date(transfer.transferDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    paymentMethodId: transfer?.paymentMethodId || '',
    transactionRef: transfer?.transactionRef || '',
    bankDetails: transfer?.bankDetails || '',
    purpose: transfer?.purpose || '',
    remarks: transfer?.remarks || '',
    proofUrl: transfer?.proofUrl || '',
  });

  // Fetch branches
  const { data: branchesData } = useQuery({
    queryKey: ['branchesList'],
    queryFn: () => branchApi.getBranchList(),
  });

  // Fetch payment methods
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => masterDataApi.paymentMethods.getAll({ limit: 100, isActive: true }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (!formData.branchId) {
      alert('Please select a branch');
      return;
    }

    if (transfer) {
      // Update existing transfer
      onSubmit({
        amount,
        transferDate: formData.transferDate,
        paymentMethodId: formData.paymentMethodId || undefined,
        transactionRef: formData.transactionRef || undefined,
        bankDetails: formData.bankDetails || undefined,
        purpose: formData.purpose || undefined,
        remarks: formData.remarks || undefined,
        proofUrl: formData.proofUrl || undefined,
      });
    } else {
      // Create new transfer
      onSubmit({
        branchId: formData.branchId,
        amount,
        transferDate: formData.transferDate,
        paymentMethodId: formData.paymentMethodId || undefined,
        transactionRef: formData.transactionRef || undefined,
        bankDetails: formData.bankDetails || undefined,
        purpose: formData.purpose || undefined,
        remarks: formData.remarks || undefined,
        proofUrl: formData.proofUrl || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {transfer ? 'Edit Transfer' : 'New Petty Cash Transfer'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={!!transfer} // Can't change branch for existing transfer
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a branch</option>
              {branchesData?.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
            {transfer && (
              <p className="text-xs text-gray-500 mt-1">
                Branch cannot be changed for existing transfers
              </p>
            )}
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.transferDate}
                onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={formData.paymentMethodId}
              onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., HDFC Bank - A/c XXXX1234"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <textarea
              rows={3}
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Purpose of this transfer..."
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
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
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : transfer ? 'Update Transfer' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
