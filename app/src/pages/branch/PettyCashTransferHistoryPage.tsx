import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pettyCashTransferApi } from '../../services/expenseApi';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Banknote, X, Filter } from 'lucide-react';

export default function PettyCashTransferHistoryPage() {
  const { user } = useAuthStore();
  const branchId = user?.activeBranch?.id;
  const branchName = user?.activeBranch?.name || 'Branch';

  // Filters state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch transfer history
  const { data: transfersData, isLoading, error } = useQuery({
    queryKey: ['branchTransferHistory', branchId, page, limit, startDate, endDate],
    queryFn: () => pettyCashTransferApi.getBranchTransferHistory(branchId!, {
      page,
      limit,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    enabled: !!branchId,
  });

  // Clear all filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  if (!branchId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No active branch selected.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading transfer history. Please try again.</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = startDate || endDate;

  // Calculate totals
  const totalTransferred = transfersData?.data.reduce((sum, transfer) => sum + Number(transfer.amount), 0) || 0;

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Petty Cash Transfer History</h1>
          <p className="text-gray-600 mt-1">{branchName} - All received petty cash transfers</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  max={endDate || format(new Date(), 'yyyy-MM-dd')}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  min={startDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Received</p>
            <p className="text-2xl font-bold text-purple-600">
              ₹{totalTransferred.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {transfersData?.pagination.total || 0} transfers
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Banknote className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">All Transfers</h2>
          <p className="text-sm text-gray-600 mt-1">
            {transfersData?.pagination.total || 0} total transfers
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : transfersData?.data.length === 0 ? (
          <div className="text-center py-12">
            <Banknote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transfers found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Clear filters to see all transfers
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transfer Date
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfersData?.data.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {format(new Date(transfer.transferDate), 'dd MMM yyyy')}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {format(new Date(transfer.createdAt), 'hh:mm a')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {transfer.employee?.name || '-'}
                        </span>
                        {transfer.employee?.email && (
                          <span className="block text-xs text-gray-500">
                            {transfer.employee.email}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {transfer.paymentMethod ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {transfer.paymentMethod.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {transfer.purpose || '-'}
                        </p>
                        {transfer.transactionRef && (
                          <p className="text-xs text-gray-500 mt-1">
                            Ref: {transfer.transactionRef}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {transfer.createdByUser?.name || '-'}
                        </span>
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

            {/* Pagination */}
            {transfersData && transfersData.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, transfersData.pagination.total)} of {transfersData.pagination.total} transfers
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, transfersData.pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg transition-colors ${
                            page === pageNum
                              ? 'bg-purple-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === transfersData.pagination.totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
