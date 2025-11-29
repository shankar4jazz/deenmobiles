import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseReturnApi } from '@/services/purchaseReturnApi';
import { useAuthStore } from '@/store/authStore';
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

type ReturnStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED';
type ReturnType = 'ALL' | 'REFUND' | 'REPLACEMENT';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function PurchaseReturnsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<ReturnType>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState({
    paymentMethodId: '',
    referenceNumber: '',
    notes: '',
  });

  // Fetch all returns
  const { data: returns, isLoading } = useQuery({
    queryKey: ['purchase-returns', user?.activeBranch?.id],
    queryFn: () => purchaseReturnApi.getAllReturns(user?.activeBranch?.id),
  });

  // Confirm return mutation
  const confirmMutation = useMutation({
    mutationFn: purchaseReturnApi.confirmReturn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
      alert('Return confirmed successfully!');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to confirm return');
    },
  });

  // Reject return mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      purchaseReturnApi.rejectReturn(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
      alert('Return rejected successfully!');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to reject return');
    },
  });

  const handleConfirmReturn = (id: string) => {
    if (window.confirm('Are you sure you want to confirm this return? Stock will be deducted.')) {
      confirmMutation.mutate(id);
    }
  };

  const handleRejectReturn = (id: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (window.confirm('Are you sure you want to reject this return?')) {
      rejectMutation.mutate({ id, reason: reason || undefined });
    }
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter returns
  const filteredReturns = returns?.filter((returnItem) => {
    const matchesSearch =
      searchQuery === '' ||
      returnItem.purchaseOrderItem?.purchaseOrder?.poNumber
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      returnItem.purchaseOrderItem?.purchaseOrder?.supplier?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      returnItem.returnReason?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || returnItem.returnStatus === statusFilter;

    const matchesType = typeFilter === 'ALL' || returnItem.returnType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const stats = {
    total: filteredReturns?.length || 0,
    pending: filteredReturns?.filter((r) => r.returnStatus === 'PENDING').length || 0,
    confirmed: filteredReturns?.filter((r) => r.returnStatus === 'CONFIRMED').length || 0,
    rejected: filteredReturns?.filter((r) => r.returnStatus === 'REJECTED').length || 0,
    totalRefundAmount:
      filteredReturns
        ?.filter((r) => r.returnType === 'REFUND')
        .reduce((sum, r) => sum + Number(r.refundAmount), 0) || 0,
    pendingRefunds:
      filteredReturns?.filter(
        (r) => r.returnType === 'REFUND' && r.returnStatus === 'CONFIRMED' && !r.refundProcessed
      ).length || 0,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <RotateCcw className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Returns</h1>
              <p className="text-sm text-gray-500 mt-1">
                Track and manage all purchase returns, refunds, and replacements
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-blue-100 rounded-md">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Returns
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-yellow-100 rounded-md">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Approval
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-green-100 rounded-md">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Confirmed</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.confirmed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-orange-100 rounded-md">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Refunds
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.pendingRefunds}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="space-y-4">
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
                    placeholder="Search by PO number, supplier, or reason..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ReturnStatus)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as ReturnType)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="ALL">All Types</option>
                    <option value="REFUND">Refund</option>
                    <option value="REPLACEMENT">Replacement</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Returns List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500">Loading returns...</p>
            </div>
          ) : !filteredReturns || filteredReturns.length === 0 ? (
            <div className="text-center py-12">
              <RotateCcw className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No returns found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'No purchase returns have been created yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Return Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReturns.map((returnItem) => (
                    <>
                      <tr key={returnItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleRowExpansion(returnItem.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedRows.has(returnItem.id) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(returnItem.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                          {returnItem.purchaseOrderItem.purchaseOrder.poNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {returnItem.purchaseOrderItem.purchaseOrder.supplier.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {returnItem.purchaseOrderItem.item?.name ||
                            returnItem.purchaseOrderItem.inventory?.productName ||
                            'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {returnItem.returnQty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              returnItem.returnType === 'REFUND'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {returnItem.returnType === 'REFUND' ? (
                              <>
                                <DollarSign className="h-3 w-3 mr-1" />
                                Refund
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Replacement
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              returnItem.returnStatus === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : returnItem.returnStatus === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {returnItem.returnStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(Number(returnItem.refundAmount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {returnItem.returnStatus === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleConfirmReturn(returnItem.id)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                  disabled={confirmMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleRejectReturn(returnItem.id)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                  disabled={rejectMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </button>
                              </>
                            )}
                            {returnItem.returnStatus === 'CONFIRMED' &&
                              returnItem.returnType === 'REFUND' &&
                              !returnItem.refundProcessed && (
                                <button
                                  onClick={() => {
                                    setSelectedReturn(returnItem);
                                    setShowRefundModal(true);
                                  }}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Process Refund
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                      {expandedRows.has(returnItem.id) && (
                        <tr>
                          <td colSpan={10} className="px-6 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  Return Details
                                </h4>
                                <dl className="grid grid-cols-1 gap-2">
                                  <div>
                                    <dt className="text-xs text-gray-500">Return Reason</dt>
                                    <dd className="text-sm text-gray-900">
                                      {returnItem.returnReason}
                                    </dd>
                                  </div>
                                  {returnItem.notes && (
                                    <div>
                                      <dt className="text-xs text-gray-500">Notes</dt>
                                      <dd className="text-sm text-gray-900">{returnItem.notes}</dd>
                                    </div>
                                  )}
                                  <div>
                                    <dt className="text-xs text-gray-500">Created By</dt>
                                    <dd className="text-sm text-gray-900">
                                      {returnItem.createdByUser.name}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-gray-500">Stock Deducted</dt>
                                    <dd className="text-sm text-gray-900">
                                      {returnItem.stockDeducted ? (
                                        <span className="text-green-600">Yes</span>
                                      ) : (
                                        <span className="text-red-600">No</span>
                                      )}
                                    </dd>
                                  </div>
                                </dl>
                              </div>

                              {returnItem.returnType === 'REFUND' && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                    Refund Information
                                  </h4>
                                  <dl className="grid grid-cols-1 gap-2">
                                    <div>
                                      <dt className="text-xs text-gray-500">Refund Amount</dt>
                                      <dd className="text-sm font-medium text-gray-900">
                                        {formatCurrency(Number(returnItem.refundAmount))}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="text-xs text-gray-500">Refund Processed</dt>
                                      <dd className="text-sm text-gray-900">
                                        {returnItem.refundProcessed ? (
                                          <span className="inline-flex items-center text-green-600">
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Processed
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center text-yellow-600">
                                            <Clock className="h-4 w-4 mr-1" />
                                            Pending
                                          </span>
                                        )}
                                      </dd>
                                    </div>
                                  </dl>
                                </div>
                              )}

                              {returnItem.returnType === 'REPLACEMENT' &&
                                returnItem.replacementPO && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                      Replacement Order
                                    </h4>
                                    <dl className="grid grid-cols-1 gap-2">
                                      <div>
                                        <dt className="text-xs text-gray-500">PO Number</dt>
                                        <dd className="text-sm font-medium text-indigo-600">
                                          {returnItem.replacementPO.poNumber}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-xs text-gray-500">Status</dt>
                                        <dd className="text-sm text-gray-900">
                                          <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                              returnItem.replacementPO.status === 'PENDING'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : returnItem.replacementPO.status === 'RECEIVED'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}
                                          >
                                            {returnItem.replacementPO.status}
                                          </span>
                                        </dd>
                                      </div>
                                    </dl>
                                  </div>
                                )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
