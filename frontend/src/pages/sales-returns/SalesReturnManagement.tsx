import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesReturnApi } from '@/services/salesReturnApi';
import { useAuthStore } from '@/store/authStore';
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Plus,
  Eye,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import type { SalesReturn, SalesReturnStatus } from '@/types';
import CreateReturnModal from '@/components/sales-returns/CreateReturnModal';
import SalesReturnDetailModal from '@/components/sales-returns/SalesReturnDetailModal';
import ProcessRefundModal from '@/components/sales-returns/ProcessRefundModal';
import { toast } from 'sonner';

type FilterStatus = 'ALL' | SalesReturnStatus;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

const getReasonLabel = (reason: string) => {
  const labels: Record<string, string> = {
    DEFECTIVE: 'Defective Item',
    WRONG_ITEM: 'Wrong Item',
    CUSTOMER_CHANGED_MIND: 'Customer Changed Mind',
    DUPLICATE_BILLING: 'Duplicate Billing',
    PRICE_ADJUSTMENT: 'Price Adjustment',
    OTHER: 'Other',
  };
  return labels[reason] || reason;
};

const getStatusBadge = (status: SalesReturnStatus) => {
  const styles: Record<SalesReturnStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
  };
  return styles[status];
};

export default function SalesReturnManagement() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Fetch all returns
  const { data: returns, isLoading } = useQuery({
    queryKey: ['sales-returns', user?.activeBranch?.id],
    queryFn: () => salesReturnApi.getAllReturns(user?.activeBranch?.id),
  });

  // Confirm return mutation
  const confirmMutation = useMutation({
    mutationFn: (id: string) => salesReturnApi.confirmReturn(id, user?.activeBranch?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      toast.success('Return confirmed successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to confirm return');
    },
  });

  // Reject return mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      salesReturnApi.rejectReturn(id, reason, user?.activeBranch?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      toast.success('Return rejected successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reject return');
    },
  });

  const handleConfirmReturn = (id: string) => {
    if (window.confirm('Are you sure you want to confirm this return?')) {
      confirmMutation.mutate(id);
    }
  };

  const handleRejectReturn = (id: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (window.confirm('Are you sure you want to reject this return?')) {
      rejectMutation.mutate({ id, reason: reason || undefined });
    }
  };

  const handleViewDetails = (returnItem: SalesReturn) => {
    setSelectedReturn(returnItem);
    setShowDetailModal(true);
  };

  const handleProcessRefund = (returnItem: SalesReturn) => {
    setSelectedReturn(returnItem);
    setShowRefundModal(true);
  };

  // Filter returns
  const filteredReturns = returns?.filter((returnItem: SalesReturn) => {
    const matchesSearch =
      searchQuery === '' ||
      returnItem.returnNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.invoice?.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.customer?.phone?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || returnItem.returnStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: returns?.length || 0,
    pending: returns?.filter((r: SalesReturn) => r.returnStatus === 'PENDING').length || 0,
    confirmed: returns?.filter((r: SalesReturn) => r.returnStatus === 'CONFIRMED').length || 0,
    rejected: returns?.filter((r: SalesReturn) => r.returnStatus === 'REJECTED').length || 0,
    totalAmount: returns?.reduce((sum: number, r: SalesReturn) => sum + Number(r.totalReturnAmount), 0) || 0,
    refundedAmount: returns?.reduce((sum: number, r: SalesReturn) => sum + Number(r.refundedAmount), 0) || 0,
    pendingRefund: returns?.filter((r: SalesReturn) => r.returnStatus === 'CONFIRMED' && !r.refundProcessed).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 rounded-lg">
            <RotateCcw className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Returns</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage returns and refunds for standalone invoices
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Return
        </button>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-md">
                  <RotateCcw className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Returns</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {formatCurrency(stats.totalAmount)} total value
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-yellow-500">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <div className="p-3 bg-yellow-100 rounded-md">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Approval</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.pending}</div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">Awaiting confirmation</div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-purple-500">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <div className="p-3 bg-purple-100 rounded-md">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Refund</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.pendingRefund}</div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">Confirmed, awaiting refund</div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-md">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Refunded</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(stats.refundedAmount)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">Total refunded amount</div>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white shadow rounded-lg">
        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by return number, invoice, or customer..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500">Loading returns...</p>
            </div>
          ) : !filteredReturns || filteredReturns.length === 0 ? (
            <div className="text-center py-12">
              <RotateCcw className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No returns found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'No sales returns have been created yet'}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Return
                </button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReturns.map((returnItem: SalesReturn) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                      {returnItem.returnNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(returnItem.returnDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                      {returnItem.invoice?.invoiceNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{returnItem.customer?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{returnItem.customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getReasonLabel(returnItem.returnReason)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {returnItem.items?.length || 0} item(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(Number(returnItem.totalReturnAmount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(returnItem.returnStatus)}`}>
                        {returnItem.returnStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {returnItem.refundProcessed ? (
                        <span className="inline-flex items-center text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Done
                        </span>
                      ) : returnItem.returnStatus === 'CONFIRMED' ? (
                        <span className="inline-flex items-center text-yellow-600 text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          Pending
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(returnItem)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {returnItem.returnStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleConfirmReturn(returnItem.id)}
                              disabled={confirmMutation.isPending}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectReturn(returnItem.id)}
                              disabled={rejectMutation.isPending}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {returnItem.returnStatus === 'CONFIRMED' && !returnItem.refundProcessed && (
                          <button
                            onClick={() => handleProcessRefund(returnItem)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateReturnModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
          }}
        />
      )}

      {showDetailModal && selectedReturn && (
        <SalesReturnDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReturn(null);
          }}
          salesReturn={selectedReturn}
        />
      )}

      {showRefundModal && selectedReturn && (
        <ProcessRefundModal
          isOpen={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedReturn(null);
          }}
          salesReturn={selectedReturn}
          onSuccess={() => {
            setShowRefundModal(false);
            setSelectedReturn(null);
            queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
          }}
        />
      )}
    </div>
  );
}
