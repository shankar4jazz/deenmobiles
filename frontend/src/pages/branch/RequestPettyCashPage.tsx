import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pettyCashRequestApi, pettyCashTransferApi } from '../../services/expenseApi';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { Wallet, AlertCircle, Send, TrendingDown, TrendingUp } from 'lucide-react';

export default function RequestPettyCashPage() {
  const { user } = useAuthStore();
  const branchId = user?.activeBranch?.id;
  const branchName = user?.activeBranch?.name || 'Branch';
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    requestedAmount: '',
    reason: '',
  });

  // Fetch branch balance
  const { data: balanceData } = useQuery({
    queryKey: ['branchBalance', branchId],
    queryFn: () => pettyCashTransferApi.getBranchBalance(branchId!),
    enabled: !!branchId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 60000, // 60 seconds
  });

  // Fetch recent requests
  const { data: recentRequests } = useQuery({
    queryKey: ['myRecentRequests', branchId],
    queryFn: () => pettyCashRequestApi.getMyRequests({ limit: 5 }),
    enabled: !!branchId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: pettyCashRequestApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRecentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myPettyCashRequests'] });
      setFormData({ requestedAmount: '', reason: '' });
      alert('Petty cash request submitted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to submit request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.requestedAmount);

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (!formData.reason || formData.reason.trim().length < 20) {
      alert('Please provide a detailed reason (at least 20 characters)');
      return;
    }

    if (!branchId) {
      alert('No active branch selected');
      return;
    }

    createRequestMutation.mutate({
      branchId,
      requestedAmount: amount,
      reason: formData.reason.trim(),
    });
  };

  const currentBalance = balanceData?.currentBalance || 0;
  const balanceColor = currentBalance >= 0 ? 'text-green-600' : 'text-red-600';
  const balanceBgColor = currentBalance >= 0 ? 'bg-green-50' : 'bg-red-50';
  const balanceBorderColor = currentBalance >= 0 ? 'border-green-200' : 'border-red-200';
  const isLowBalance = currentBalance < 5000;

  if (!branchId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No active branch selected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Petty Cash</h1>
        <p className="text-gray-600 mt-1">{branchName} - Submit Cash Request to Admin</p>
      </div>

      {/* Balance Card */}
      <div className={`${balanceBgColor} ${balanceBorderColor} border-2 rounded-xl p-4 shadow-sm`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Current Balance</p>
            <p className={`text-3xl font-bold ${balanceColor}`}>
              ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {balanceData && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Received:</span>
                  <span className="font-semibold text-green-600">
                    ₹{balanceData.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-semibold text-red-600">
                    ₹{balanceData.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className={`p-2.5 ${currentBalance >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg`}>
            <Wallet className={`w-6 h-6 ${balanceColor}`} />
          </div>
        </div>
      </div>

      {/* Low Balance Warning */}
      {isLowBalance && currentBalance >= 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Low Balance Warning</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your petty cash balance is running low. Consider requesting additional funds.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentBalance < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Negative Balance</h3>
              <p className="text-sm text-red-700 mt-1">
                Your branch has a negative balance. Please request funds immediately and contact admin to resolve this discrepancy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Request Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">New Cash Request</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requested Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.requestedAmount}
              onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter amount"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the amount of petty cash you need for branch operations
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason / Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              minLength={20}
              maxLength={500}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Provide a detailed explanation for why you need this amount (minimum 20 characters)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.reason.length}/500 characters (minimum 20 required)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFormData({ requestedAmount: '', reason: '' })}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={createRequestMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Requests */}
      {recentRequests && recentRequests.data.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
            <p className="text-sm text-gray-600 mt-1">Last 5 submitted requests</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request #
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRequests.data.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-purple-600">
                        {request.requestNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {format(new Date(request.createdAt), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 line-clamp-2 max-w-md">
                        {request.reason}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{Number(request.requestedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {request.status === 'PENDING' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {request.status === 'APPROVED' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      )}
                      {request.status === 'REJECTED' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Rejected
                        </span>
                      )}
                      {request.status === 'CANCELLED' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Cancelled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
