import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pettyCashRequestApi } from '../../services/expenseApi';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import {
  Search,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { PettyCashRequest } from '../../types/expense';

export default function MyPettyCashRequestsPage() {
  const { user } = useAuthStore();
  const branchId = user?.activeBranch?.id;
  const branchName = user?.activeBranch?.name || 'Branch';
  const queryClient = useQueryClient();

  // State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<PettyCashRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch my requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['myPettyCashRequests', currentPage, searchTerm, selectedStatus],
    queryFn: () =>
      pettyCashRequestApi.getMyRequests({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: selectedStatus || undefined,
      }),
    enabled: !!branchId,
  });

  // Cancel request mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => pettyCashRequestApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPettyCashRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myRecentRequests'] });
    },
  });

  const handleViewRequest = (request: PettyCashRequest) => {
    setViewingRequest(request);
    setIsViewModalOpen(true);
  };

  const handleCancel = (id: string, requestNumber: string) => {
    if (window.confirm(`Are you sure you want to cancel request ${requestNumber}?`)) {
      cancelMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Ban className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
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

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Petty Cash Requests</h1>
        <p className="text-gray-600 mt-1">{branchName} - View & Track Your Requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : requestsData?.data.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No requests found</p>
            <p className="text-sm text-gray-400 mt-2">
              You haven't submitted any petty cash requests yet
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request #
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted On
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
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed By
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requestsData?.data.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-purple-600">
                          {request.requestNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {format(new Date(request.createdAt), 'dd MMM yyyy, HH:mm')}
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
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {request.approvedByUser ? (
                          <div>
                            <p className="text-sm text-gray-900">{request.approvedByUser.name}</p>
                            <p className="text-xs text-gray-500">
                              {request.approvedAt && format(new Date(request.approvedAt), 'dd MMM yyyy')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewRequest(request)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancel(request.id, request.requestNumber)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel request"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {requestsData && requestsData.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {requestsData.pagination.page} of {requestsData.pagination.totalPages}
                  {' '}({requestsData.pagination.total} total requests)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(requestsData.pagination.totalPages, p + 1))}
                    disabled={currentPage === requestsData.pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Modal */}
      {isViewModalOpen && viewingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Request Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Request Number</p>
                  <p className="font-semibold text-purple-600">{viewingRequest.requestNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(viewingRequest.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested Amount</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{Number(viewingRequest.requestedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted On</p>
                  <p className="font-semibold">
                    {format(new Date(viewingRequest.createdAt), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Reason / Justification</p>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{viewingRequest.reason}</p>
              </div>

              {viewingRequest.approvedByUser && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Processed By</p>
                      <p className="font-medium text-gray-900">{viewingRequest.approvedByUser.name}</p>
                      <p className="text-xs text-gray-500">{viewingRequest.approvedByUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Processed On</p>
                      <p className="font-medium">
                        {viewingRequest.approvedAt &&
                          format(new Date(viewingRequest.approvedAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {viewingRequest.status === 'REJECTED' && viewingRequest.rejectedReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{viewingRequest.rejectedReason}</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-4 py-3 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
