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
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  ArrowUpRight,
  Ban,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import type { PurchaseItemReturn } from '@/types';
import ReturnDetailsModal from '@/components/purchases/ReturnDetailsModal';

type ReturnStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED';
type ReturnType = 'ALL' | 'REFUND' | 'REPLACEMENT';
type TabType = 'overview' | 'refunds' | 'replacements' | 'history';

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

const formatDateTime = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy hh:mm a');
};

export default function PurchaseReturnManagement() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<ReturnType>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedReturn, setSelectedReturn] = useState<PurchaseItemReturn | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch all returns
  const { data: returns, isLoading } = useQuery({
    queryKey: ['purchase-returns', user?.activeBranch?.id],
    queryFn: () => purchaseReturnApi.getAllReturns(user?.activeBranch?.id),
  });

  // Confirm return mutation
  const confirmMutation = useMutation({
    mutationFn: (id: string) => purchaseReturnApi.confirmReturn(id, user?.activeBranch?.id),
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
      purchaseReturnApi.rejectReturn(id, reason, user?.activeBranch?.id),
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
  const filteredReturns = returns?.filter((returnItem: PurchaseItemReturn) => {
    const matchesSearch =
      searchQuery === '' ||
      returnItem.purchaseOrderItem?.purchaseOrder?.poNumber
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      returnItem.purchaseOrderItem?.purchaseOrder?.supplier?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      returnItem.returnReason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || returnItem.returnStatus === statusFilter;

    const matchesType = typeFilter === 'ALL' || returnItem.returnType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate comprehensive statistics
  const stats = {
    total: filteredReturns?.length || 0,
    pending: filteredReturns?.filter((r: PurchaseItemReturn) => r.returnStatus === 'PENDING').length || 0,
    confirmed: filteredReturns?.filter((r: PurchaseItemReturn) => r.returnStatus === 'CONFIRMED').length || 0,
    rejected: filteredReturns?.filter((r: PurchaseItemReturn) => r.returnStatus === 'REJECTED').length || 0,

    // Refund Metrics - 4 States
    awaitingApprovalRefunds:
      filteredReturns?.filter(
        (r: PurchaseItemReturn) => r.returnType === 'REFUND' && r.returnStatus === 'PENDING'
      ).length || 0,
    approvedNotProcessedRefunds:
      filteredReturns?.filter(
        (r: PurchaseItemReturn) =>
          r.returnType === 'REFUND' &&
          r.returnStatus === 'CONFIRMED' &&
          (!r.refundTransactions || r.refundTransactions.length === 0)
      ).length || 0,
    processedRefunds:
      filteredReturns?.filter(
        (r: PurchaseItemReturn) =>
          r.returnType === 'REFUND' &&
          r.refundTransactions &&
          r.refundTransactions.length > 0
      ).length || 0,
    rejectedRefunds:
      filteredReturns?.filter(
        (r: PurchaseItemReturn) => r.returnType === 'REFUND' && r.returnStatus === 'REJECTED'
      ).length || 0,

    // Refund Amounts
    totalRefundAmount:
      filteredReturns
        ?.filter((r: PurchaseItemReturn) => r.returnType === 'REFUND')
        .reduce((sum, r) => sum + Number(r.refundAmount), 0) || 0,
    awaitingApprovalAmount:
      filteredReturns
        ?.filter((r: PurchaseItemReturn) => r.returnType === 'REFUND' && r.returnStatus === 'PENDING')
        .reduce((sum, r) => sum + Number(r.refundAmount), 0) || 0,
    approvedNotProcessedAmount:
      filteredReturns
        ?.filter(
          (r: PurchaseItemReturn) =>
            r.returnType === 'REFUND' &&
            r.returnStatus === 'CONFIRMED' &&
            (!r.refundTransactions || r.refundTransactions.length === 0)
        )
        .reduce((sum, r) => sum + Number(r.refundAmount), 0) || 0,
    processedRefundAmount:
      filteredReturns
        ?.filter(
          (r: PurchaseItemReturn) =>
            r.returnType === 'REFUND' &&
            r.refundTransactions &&
            r.refundTransactions.length > 0
        )
        .reduce((sum, r) => sum + Number(r.refundAmount), 0) || 0,

    // Replacement Metrics - 3 States
    totalReplacements:
      filteredReturns?.filter((r: PurchaseItemReturn) => r.returnType === 'REPLACEMENT').length || 0,
    awaitingPOCreation:
      filteredReturns?.filter(
        (r: PurchaseItemReturn) =>
          r.returnType === 'REPLACEMENT' &&
          r.returnStatus === 'CONFIRMED' &&
          !r.replacementPOId
      ).length || 0,
    replacementsInProgress:
      filteredReturns?.filter(
        (r: PurchaseItemReturn) =>
          r.returnType === 'REPLACEMENT' &&
          r.replacementPOId &&
          r.replacementPO?.status !== 'RECEIVED'
      ).length || 0,
    completedReplacements:
      filteredReturns?.filter(
        (r: PurchaseItemReturn) =>
          r.returnType === 'REPLACEMENT' &&
          r.replacementPO?.status === 'RECEIVED'
      ).length || 0,
  };

  // Tab content
  const tabs = [
    { id: 'overview', label: 'Returns Overview', icon: Package },
    { id: 'refunds', label: 'Refund Tracking', icon: DollarSign },
    { id: 'replacements', label: 'Replacement Tracking', icon: RefreshCw },
    { id: 'history', label: 'History Timeline', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <RotateCcw className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Return Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive tracking for returns, refunds, and replacements
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-md">
                  <Package className="h-6 w-6 text-blue-600" />
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
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Pending: {stats.pending}</span>
              <span>Confirmed: {stats.confirmed}</span>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Actions</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.pending}</div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">Awaiting approval</div>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Refunds</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(stats.totalRefundAmount)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span className="text-yellow-600">Pending: {stats.pendingRefunds}</span>
              <span className="text-green-600">Processed: {stats.processedRefunds}</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-purple-500">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <div className="p-3 bg-purple-100 rounded-md">
                  <RefreshCw className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Replacements</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.totalReplacements}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span className="text-yellow-600">Pending: {stats.pendingReplacements}</span>
              <span className="text-green-600">Completed: {stats.completedReplacements}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
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

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTab
              returns={filteredReturns || []}
              isLoading={isLoading}
              expandedRows={expandedRows}
              toggleRowExpansion={toggleRowExpansion}
              handleConfirmReturn={handleConfirmReturn}
              handleRejectReturn={handleRejectReturn}
              confirmMutation={confirmMutation}
              rejectMutation={rejectMutation}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              onViewDetails={(returnItem) => {
                console.log('View Details clicked:', returnItem);
                setSelectedReturn(returnItem);
                setShowDetailsModal(true);
              }}
            />
          )}

          {activeTab === 'refunds' && (
            <RefundsTab returns={filteredReturns || []} isLoading={isLoading} />
          )}

          {activeTab === 'replacements' && (
            <ReplacementsTab returns={filteredReturns || []} isLoading={isLoading} />
          )}

          {activeTab === 'history' && (
            <HistoryTab returns={filteredReturns || []} isLoading={isLoading} />
          )}
        </div>
      </div>

      {/* Return Details Modal */}
      {showDetailsModal && selectedReturn && (
        <ReturnDetailsModal
          returnItem={selectedReturn}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReturn(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Overview Tab Component
// ============================================================================
interface OverviewTabProps {
  returns: PurchaseItemReturn[];
  isLoading: boolean;
  expandedRows: Set<string>;
  toggleRowExpansion: (id: string) => void;
  handleConfirmReturn: (id: string) => void;
  handleRejectReturn: (id: string) => void;
  confirmMutation: any;
  rejectMutation: any;
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  onViewDetails: (returnItem: PurchaseItemReturn) => void;
}

function OverviewTab({
  returns,
  isLoading,
  expandedRows,
  toggleRowExpansion,
  handleConfirmReturn,
  handleRejectReturn,
  confirmMutation,
  rejectMutation,
  onViewDetails,
  searchQuery,
  statusFilter,
  typeFilter,
}: OverviewTabProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading returns...</p>
      </div>
    );
  }

  if (!returns || returns.length === 0) {
    return (
      <div className="text-center py-12">
        <RotateCcw className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No returns found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
            ? 'Try adjusting your filters'
            : 'No purchase returns have been created yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
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
          {returns.map((returnItem) => (
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
                  {formatDate(returnItem.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                  {returnItem.purchaseOrderItem?.purchaseOrder?.poNumber || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {returnItem.purchaseOrderItem?.purchaseOrder?.supplier?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {returnItem.purchaseOrderItem?.item?.name ||
                    returnItem.purchaseOrderItem?.inventory?.productName ||
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
                    <button
                      onClick={() => {
                        console.log('Button clicked for return:', returnItem.id);
                        onViewDetails(returnItem);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
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
                  </div>
                </td>
              </tr>
              {expandedRows.has(returnItem.id) && (
                <tr>
                  <td colSpan={10} className="px-6 py-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          Return Details
                        </h4>
                        <dl className="grid grid-cols-1 gap-3">
                          <div>
                            <dt className="text-xs text-gray-500">Return Reason</dt>
                            <dd className="text-sm font-medium text-gray-900">
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
                              {returnItem.createdByUser?.name || 'N/A'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500">Stock Deducted</dt>
                            <dd className="text-sm text-gray-900">
                              {returnItem.stockDeducted ? (
                                <span className="inline-flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-red-600">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  No
                                </span>
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {returnItem.returnType === 'REFUND' && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                            Refund Information
                          </h4>
                          <dl className="grid grid-cols-1 gap-3">
                            <div>
                              <dt className="text-xs text-gray-500">Refund Amount</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {formatCurrency(Number(returnItem.refundAmount))}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-gray-500">Refund Status</dt>
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

                      {returnItem.returnType === 'REPLACEMENT' && returnItem.replacementPO && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <RefreshCw className="h-4 w-4 mr-2 text-gray-500" />
                            Replacement Order
                          </h4>
                          <dl className="grid grid-cols-1 gap-3">
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
  );
}

// ============================================================================
// Refunds Tab Component
// ============================================================================
interface RefundsTabProps {
  returns: PurchaseItemReturn[];
  isLoading: boolean;
}

function RefundsTab({ returns, isLoading }: RefundsTabProps) {
  const refundReturns = returns.filter((r) => r.returnType === 'REFUND');

  const refundStats = {
    total: refundReturns.length,
    pending: refundReturns.filter((r) => !r.refundProcessed && r.returnStatus === 'CONFIRMED')
      .length,
    processed: refundReturns.filter((r) => r.refundProcessed).length,
    totalAmount: refundReturns.reduce((sum, r) => sum + Number(r.refundAmount), 0),
    pendingAmount: refundReturns
      .filter((r) => !r.refundProcessed && r.returnStatus === 'CONFIRMED')
      .reduce((sum, r) => sum + Number(r.refundAmount), 0),
    processedAmount: refundReturns
      .filter((r) => r.refundProcessed)
      .reduce((sum, r) => sum + Number(r.refundAmount), 0),
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading refund data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refund Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Refunds</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">{refundStats.total}</p>
              <p className="text-lg font-semibold text-blue-700 mt-1">
                {formatCurrency(refundStats.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <DollarSign className="h-8 w-8 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-5 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending Refunds</p>
              <p className="text-2xl font-bold text-yellow-900 mt-2">{refundStats.pending}</p>
              <p className="text-lg font-semibold text-yellow-700 mt-1">
                {formatCurrency(refundStats.pendingAmount)}
              </p>
            </div>
            <div className="p-3 bg-yellow-200 rounded-full">
              <Clock className="h-8 w-8 text-yellow-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Processed Refunds</p>
              <p className="text-2xl font-bold text-green-900 mt-2">{refundStats.processed}</p>
              <p className="text-lg font-semibold text-green-700 mt-1">
                {formatCurrency(refundStats.processedAmount)}
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Refunds List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Refund Transactions</h3>
          <p className="text-sm text-gray-500 mt-1">Detailed list of all refund transactions</p>
        </div>
        <div className="divide-y divide-gray-200">
          {refundReturns.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No refunds found</h3>
              <p className="mt-1 text-sm text-gray-500">No refund transactions available</p>
            </div>
          ) : (
            refundReturns.map((returnItem) => (
              <div
                key={returnItem.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          returnItem.refundProcessed ? 'bg-green-100' : 'bg-yellow-100'
                        }`}
                      >
                        {returnItem.refundProcessed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          PO #{returnItem.purchaseOrderItem?.purchaseOrder?.poNumber || 'N/A'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {returnItem.purchaseOrderItem?.item?.name ||
                            returnItem.purchaseOrderItem?.inventory?.productName ||
                            'N/A'}{' '}
                          - Qty: {returnItem.returnQty}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(returnItem.createdAt)}
                      </span>
                      <span>Reason: {returnItem.returnReason}</span>
                      <span>
                        Status:{' '}
                        <span
                          className={`font-medium ${
                            returnItem.returnStatus === 'CONFIRMED'
                              ? 'text-green-600'
                              : returnItem.returnStatus === 'PENDING'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {returnItem.returnStatus}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(Number(returnItem.refundAmount))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {returnItem.refundProcessed ? (
                        <span className="text-green-600 font-medium">Processed</span>
                      ) : returnItem.returnStatus === 'CONFIRMED' ? (
                        <span className="text-yellow-600 font-medium">Pending Processing</span>
                      ) : (
                        <span className="text-gray-600">Awaiting Confirmation</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Replacements Tab Component
// ============================================================================
interface ReplacementsTabProps {
  returns: PurchaseItemReturn[];
  isLoading: boolean;
}

function ReplacementsTab({ returns, isLoading }: ReplacementsTabProps) {
  const replacementReturns = returns.filter((r) => r.returnType === 'REPLACEMENT');

  const replacementStats = {
    total: replacementReturns.length,
    pending: replacementReturns.filter(
      (r) => r.returnStatus === 'CONFIRMED' && r.replacementPO?.status !== 'RECEIVED'
    ).length,
    completed: replacementReturns.filter((r) => r.replacementPO?.status === 'RECEIVED').length,
    inProgress: replacementReturns.filter(
      (r) =>
        r.returnStatus === 'CONFIRMED' &&
        r.replacementPO &&
        r.replacementPO.status !== 'RECEIVED'
    ).length,
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading replacement data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Replacement Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Replacements</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{replacementStats.total}</p>
            </div>
            <div className="p-3 bg-purple-200 rounded-full">
              <RefreshCw className="h-8 w-8 text-purple-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {replacementStats.inProgress}
              </p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <Clock className="h-8 w-8 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {replacementStats.completed}
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Replacements List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Replacement Orders</h3>
          <p className="text-sm text-gray-500 mt-1">Track all replacement purchase orders</p>
        </div>
        <div className="divide-y divide-gray-200">
          {replacementReturns.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No replacements found</h3>
              <p className="mt-1 text-sm text-gray-500">No replacement orders available</p>
            </div>
          ) : (
            replacementReturns.map((returnItem) => (
              <div
                key={returnItem.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          returnItem.replacementPO?.status === 'RECEIVED'
                            ? 'bg-green-100'
                            : returnItem.replacementPO
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        {returnItem.replacementPO?.status === 'RECEIVED' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : returnItem.replacementPO ? (
                          <Clock className="h-5 w-5 text-blue-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Original PO: #{returnItem.purchaseOrderItem?.purchaseOrder?.poNumber || 'N/A'}
                        </h4>
                        {returnItem.replacementPO && (
                          <p className="text-sm text-indigo-600 font-medium">
                            Replacement PO: #{returnItem.replacementPO.poNumber}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {returnItem.purchaseOrderItem?.item?.name ||
                            returnItem.purchaseOrderItem?.inventory?.productName ||
                            'N/A'}{' '}
                          - Qty: {returnItem.returnQty}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(returnItem.createdAt)}
                      </span>
                      <span>Reason: {returnItem.returnReason}</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    {returnItem.replacementPO ? (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          returnItem.replacementPO.status === 'RECEIVED'
                            ? 'bg-green-100 text-green-800'
                            : returnItem.replacementPO.status === 'PENDING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {returnItem.replacementPO.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Awaiting PO Creation
                      </span>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Return Status:{' '}
                      <span className="font-medium">{returnItem.returnStatus}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// History Tab Component
// ============================================================================
interface HistoryTabProps {
  returns: PurchaseItemReturn[];
  isLoading: boolean;
}

function HistoryTab({ returns, isLoading }: HistoryTabProps) {
  // Sort returns by date (most recent first)
  const sortedReturns = [...returns].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{sortedReturns.length}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {
                  sortedReturns.filter((r) => {
                    const returnDate = new Date(r.createdAt);
                    const now = new Date();
                    return (
                      returnDate.getMonth() === now.getMonth() &&
                      returnDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Confirmed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {sortedReturns.filter((r) => r.returnStatus === 'CONFIRMED').length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {sortedReturns.filter((r) => r.returnStatus === 'REJECTED').length}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
          <p className="text-sm text-gray-500 mt-1">Chronological history of all return activities</p>
        </div>
        <div className="p-6">
          {sortedReturns.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activity found</h3>
              <p className="mt-1 text-sm text-gray-500">No return history available</p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {sortedReturns.map((returnItem, idx) => (
                  <li key={returnItem.id}>
                    <div className="relative pb-8">
                      {idx !== sortedReturns.length - 1 && (
                        <span
                          className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${
                              returnItem.returnStatus === 'CONFIRMED'
                                ? 'bg-green-500'
                                : returnItem.returnStatus === 'REJECTED'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }`}
                          >
                            {returnItem.returnStatus === 'CONFIRMED' ? (
                              <CheckCircle className="h-5 w-5 text-white" />
                            ) : returnItem.returnStatus === 'REJECTED' ? (
                              <Ban className="h-5 w-5 text-white" />
                            ) : (
                              <Clock className="h-5 w-5 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {returnItem.returnType === 'REFUND' ? 'Refund' : 'Replacement'}{' '}
                                Return {returnItem.returnStatus.toLowerCase()}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatDateTime(returnItem.createdAt)}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                returnItem.returnType === 'REFUND'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {returnItem.returnType}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <p>
                              <span className="font-medium">PO:</span>{' '}
                              {returnItem.purchaseOrderItem?.purchaseOrder?.poNumber || 'N/A'}
                            </p>
                            <p>
                              <span className="font-medium">Item:</span>{' '}
                              {returnItem.purchaseOrderItem?.item?.name ||
                                returnItem.purchaseOrderItem?.inventory?.productName ||
                                'N/A'}{' '}
                              (Qty: {returnItem.returnQty})
                            </p>
                            <p>
                              <span className="font-medium">Reason:</span> {returnItem.returnReason}
                            </p>
                            {returnItem.returnType === 'REFUND' && (
                              <p>
                                <span className="font-medium">Amount:</span>{' '}
                                {formatCurrency(Number(returnItem.refundAmount))}{' '}
                                {returnItem.refundProcessed && (
                                  <span className="text-green-600 text-xs">(Processed)</span>
                                )}
                              </p>
                            )}
                            {returnItem.replacementPO && (
                              <p>
                                <span className="font-medium">Replacement PO:</span>{' '}
                                {returnItem.replacementPO.poNumber} -{' '}
                                <span
                                  className={
                                    returnItem.replacementPO.status === 'RECEIVED'
                                      ? 'text-green-600'
                                      : 'text-blue-600'
                                  }
                                >
                                  {returnItem.replacementPO.status}
                                </span>
                              </p>
                            )}
                            {returnItem.notes && (
                              <p className="mt-1 text-xs text-gray-500 italic">
                                Note: {returnItem.notes}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Created by: {returnItem.createdByUser?.name || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
