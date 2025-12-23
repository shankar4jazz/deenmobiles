import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  warrantyApi,
  WarrantyRecord,
  WarrantyFilters,
  getWarrantyStatusColor,
  formatWarrantyDays,
} from '@/services/warrantyApi';
import { customerApi } from '@/services/customerApi';
import { branchApi } from '@/services/branchApi';
import {
  Shield,
  Search,
  Filter,
  Calendar,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  Clock,
} from 'lucide-react';

type WarrantyStatus = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'CLAIMED';

const STATUS_OPTIONS: { value: WarrantyStatus; label: string }[] = [
  { value: 'ALL', label: 'All Warranties' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CLAIMED', label: 'Claimed' },
];

export default function WarrantyManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus>('ALL');
  const [branchFilter, setBranchFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Build filters
  const filters: WarrantyFilters = {
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    branchId: branchFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  };

  // Fetch warranties
  const { data: warrantiesData, isLoading } = useQuery({
    queryKey: ['warranties', filters],
    queryFn: () => warrantyApi.searchWarranties(filters),
  });

  // Fetch warranty stats
  const { data: statsData } = useQuery({
    queryKey: ['warranty-stats', branchFilter],
    queryFn: () => warrantyApi.getWarrantyStats(branchFilter || undefined),
  });

  // Fetch branches for filter
  const { data: branchesData } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => branchApi.getBranches(),
  });

  const warranties = warrantiesData?.warranties || [];
  const pagination = warrantiesData?.pagination;
  const stats = statsData;
  const branches = branchesData || [];

  const getStatusIcon = (warranty: WarrantyRecord) => {
    if (warranty.isClaimed) {
      return <ShieldAlert className="w-5 h-5 text-blue-600" />;
    }
    if (warranty.isExpired) {
      return <ShieldX className="w-5 h-5 text-gray-400" />;
    }
    return <ShieldCheck className="w-5 h-5 text-green-600" />;
  };

  const getStatusLabel = (warranty: WarrantyRecord) => {
    if (warranty.isClaimed) return 'CLAIMED';
    if (warranty.isExpired) return 'EXPIRED';
    return 'ACTIVE';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setBranchFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Warranty Management</h1>
            <p className="text-sm text-gray-500">Track and manage product warranties</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActive}</p>
                <p className="text-xs text-gray-500">Active Warranties</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.expiringThisMonth}</p>
                <p className="text-xs text-gray-500">Expiring This Month</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.claimedThisMonth}</p>
                <p className="text-xs text-gray-500">Claimed This Month</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <ShieldX className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExpired}</p>
                <p className="text-xs text-gray-500">Total Expired</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as WarrantyStatus);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Start Date"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="End Date"
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Warranties Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Warranty #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Branch
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <p className="text-gray-500 mt-2 text-sm">Loading warranties...</p>
                  </td>
                </tr>
              ) : warranties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No warranties found</p>
                  </td>
                </tr>
              ) : (
                warranties.map((warranty: WarrantyRecord) => (
                  <tr key={warranty.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-purple-600">
                        {warranty.warrantyNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {warranty.item?.itemName || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {warranty.customer?.name || 'Unknown'}
                          </p>
                          {warranty.customer?.phone && (
                            <p className="text-xs text-gray-500">{warranty.customer.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {warranty.sourceType === 'SERVICE' ? (
                        <Link
                          to={`/branch/services/${warranty.serviceId}`}
                          className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                        >
                          {warranty.service?.serviceNumber || 'Service'}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-600">
                          Invoice #{warranty.invoice?.invoiceNumber || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {formatWarrantyDays(warranty.warrantyDays)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">{formatDate(warranty.endDate)}</p>
                        {!warranty.isExpired && !warranty.isClaimed && (
                          <p className="text-xs text-green-600">
                            {warranty.daysRemaining} days left
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getWarrantyStatusColor(
                          getStatusLabel(warranty)
                        )}`}
                      >
                        {getStatusIcon(warranty)}
                        {getStatusLabel(warranty)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {warranty.branch?.name || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to{' '}
              {Math.min(page * limit, pagination.total)} of {pagination.total} warranties
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
