import { useQuery } from '@tanstack/react-query';
import { pettyCashTransferApi, pettyCashRequestApi } from '../../services/expenseApi';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { Wallet, TrendingUp, Clock, Banknote, ArrowRight, Send, History } from 'lucide-react';
import { Link } from 'react-router-dom';

// Helper function to safely format dates
const formatSafeDate = (date: any, formatStr: string = 'dd MMM yyyy') => {
  if (!date) return '-';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '-';
  return format(dateObj, formatStr);
};

export default function PettyCashDashboard() {
  const { user } = useAuthStore();
  const branchId = user?.activeBranch?.id;
  const branchName = user?.activeBranch?.name || 'Branch';

  // Fetch branch balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['branchBalance', branchId],
    queryFn: () => pettyCashTransferApi.getBranchBalance(branchId!),
    enabled: !!branchId,
  });

  // Fetch recent transfers (last 5)
  const { data: transfersData, isLoading: transfersLoading } = useQuery({
    queryKey: ['recentTransfers', branchId],
    queryFn: () => pettyCashTransferApi.getBranchTransferHistory(branchId!, {
      page: 1,
      limit: 5,
    }),
    enabled: !!branchId,
  });

  // Fetch recent requests (last 5)
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['recentRequests', branchId],
    queryFn: () => pettyCashRequestApi.getMyRequests({
      page: 1,
      limit: 5,
    }),
    enabled: !!branchId,
  });

  // Fetch pending requests count
  const { data: pendingRequestsData } = useQuery({
    queryKey: ['pendingRequestsCount', branchId],
    queryFn: () => pettyCashRequestApi.getMyRequests({
      page: 1,
      limit: 1,
      status: 'pending',
    }),
    enabled: !!branchId,
  });

  if (!branchId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No active branch selected.</p>
        </div>
      </div>
    );
  }

  const isLoading = balanceLoading || transfersLoading || requestsLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const currentBalance = Number(balanceData?.currentBalance || 0);
  const totalReceived = Number(balanceData?.totalReceived || 0);
  const totalSpent = totalReceived - currentBalance;
  const pendingRequests = pendingRequestsData?.pagination?.total || 0;

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Current Balance</p>
              <h3 className="text-2xl font-bold">
                ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2.5 bg-white/20 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-purple-100 text-xs">{branchName}</p>
        </div>

        {/* Total Received */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Received</p>
              <h3 className="text-xl font-bold text-gray-900">
                ₹{totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="p-2.5 bg-green-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Spent</p>
              <h3 className="text-xl font-bold text-gray-900">
                ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Via expenses</p>
            </div>
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <Banknote className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Pending Requests</p>
              <h3 className="text-xl font-bold text-gray-900">{pendingRequests}</h3>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </div>
            <div className="p-2.5 bg-yellow-100 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/branch/petty-cash?tab=request"
            className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Send className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Request Cash</p>
              <p className="text-xs text-gray-600">Submit new request</p>
            </div>
          </Link>

          <Link
            to="/branch/petty-cash?tab=transfers"
            className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">View All Transfers</p>
              <p className="text-xs text-gray-600">Complete history</p>
            </div>
          </Link>

          <Link
            to="/branch/petty-cash?tab=requests"
            className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">My Requests</p>
              <p className="text-xs text-gray-600">Track status</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Transfers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Transfers</h2>
            <p className="text-sm text-gray-600 mt-1">Last 5 transfers received</p>
          </div>
          <Link
            to="/branch/petty-cash?tab=transfers"
            className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {transfersData?.data && transfersData.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfersData.data.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatSafeDate(transfer.transferDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{transfer.employee?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm text-gray-900 truncate">{transfer.purpose || '-'}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-green-600">
                        + ₹{Number(transfer.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transfers found</p>
          </div>
        )}
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
            <p className="text-sm text-gray-600 mt-1">Last 5 petty cash requests</p>
          </div>
          <Link
            to="/branch/petty-cash?tab=requests"
            className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {requestsData?.data && requestsData.data.length > 0 ? (
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
                    Purpose
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requestsData.data.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{request.requestNumber}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatSafeDate(request.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm text-gray-900 truncate">{request.reason}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{Number(request.requestedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}
