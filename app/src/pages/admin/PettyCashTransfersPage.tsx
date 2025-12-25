import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pettyCashTransferApi } from '@/services/expenseApi';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Edit2,
  X,
  Wallet,
  Receipt,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import {
  PettyCashTransfer,
  CreatePettyCashTransferDto,
  UpdatePettyCashTransferDto,
} from '@/types/expense';
import TransferFormModal from '@/components/admin/TransferFormModal';

export default function PettyCashTransfersPage() {
  const queryClient = useQueryClient();

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<PettyCashTransfer | null>(null);
  const [viewingTransfer, setViewingTransfer] = useState<PettyCashTransfer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch transfers
  const { data: transfersData, isLoading } = useQuery({
    queryKey: ['pettyCashTransfers', currentPage, searchTerm, selectedStatus],
    queryFn: () =>
      pettyCashTransferApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: selectedStatus || undefined,
      }),
    staleTime: 1 * 60 * 1000, // 1 minute - financial data needs fresher updates
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['pettyCashStats'],
    queryFn: () => pettyCashTransferApi.getStats(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Create transfer mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePettyCashTransferDto) => pettyCashTransferApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pettyCashTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['pettyCashStats'] });
      queryClient.invalidateQueries({ queryKey: ['branchBalance'] });
      setIsModalOpen(false);
    },
  });

  // Update transfer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePettyCashTransferDto }) =>
      pettyCashTransferApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pettyCashTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['pettyCashStats'] });
      setIsModalOpen(false);
      setEditingTransfer(null);
    },
  });

  // Cancel transfer mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => pettyCashTransferApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pettyCashTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['pettyCashStats'] });
      queryClient.invalidateQueries({ queryKey: ['branchBalance'] });
    },
  });

  const handleOpenModal = (transfer?: PettyCashTransfer) => {
    if (transfer) {
      setEditingTransfer(transfer);
    } else {
      setEditingTransfer(null);
    }
    setIsModalOpen(true);
  };

  const handleViewTransfer = (transfer: PettyCashTransfer) => {
    setViewingTransfer(transfer);
    setIsViewModalOpen(true);
  };

  const handleCancel = (id: string, transferNumber: string) => {
    if (window.confirm(`Are you sure you want to cancel transfer ${transferNumber}?`)) {
      cancelMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* Header with Stats */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Petty Cash Transfers</h1>
        <p className="text-gray-600 mt-1">Manage cash allocations to branches</p>
      </div>

      {/* Stats Cards */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Transfers</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.totalTransfers}</p>
              </div>
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Completed</p>
                <p className="text-2xl font-bold text-green-600">{statsData.completedTransfers}</p>
              </div>
              <div className="p-2.5 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{statsData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-2.5 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transfers..."
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

          {/* Add Transfer Button */}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Transfer
          </button>
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
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : transfersData?.data.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transfers found</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Create your first transfer
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transfer #
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfersData?.data.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-purple-600">
                          {transfer.transferNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {format(new Date(transfer.transferDate), 'dd MMM yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transfer.branch.name}</p>
                          <p className="text-xs text-gray-500">{transfer.branch.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 line-clamp-2 max-w-md">
                          {transfer.purpose || 'N/A'}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-900">
                          ₹{Number(transfer.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {getStatusBadge(transfer.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewTransfer(transfer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {transfer.status !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={() => handleOpenModal(transfer)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit transfer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(transfer.id, transfer.transferNumber)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel transfer"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {transfersData && transfersData.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {transfersData.pagination.page} of {transfersData.pagination.totalPages}
                  {' '}({transfersData.pagination.total} total transfers)
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
                    onClick={() => setCurrentPage((p) => Math.min(transfersData.pagination.totalPages, p + 1))}
                    disabled={currentPage === transfersData.pagination.totalPages}
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <TransferFormModal
          transfer={editingTransfer}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransfer(null);
          }}
          onSubmit={(data) => {
            if (editingTransfer) {
              updateMutation.mutate({ id: editingTransfer.id, data });
            } else {
              createMutation.mutate(data as CreatePettyCashTransferDto);
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* View Modal - Placeholder for now */}
      {isViewModalOpen && viewingTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Transfer Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600">Transfer details will be shown here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
