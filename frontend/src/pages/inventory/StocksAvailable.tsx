import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/services/inventoryApi';
import BranchLayout from '@/components/layout/BranchLayout';
import { InventoryFilters } from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
  Search,
  Package,
  AlertTriangle,
  Filter,
  CheckCircle,
  XCircle,
  TrendingDown,
} from 'lucide-react';
import {
  INVENTORY_CATEGORIES,
  STOCK_STATUS_OPTIONS,
  getCategoryLabel,
  getUnitLabel,
  getStockStatusColor,
  getStockStatusText,
} from '@/constants/inventory';

export default function StocksAvailable() {
  const user = useAuthStore((state) => state.user);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: undefined,
    stockStatus: 'all',
    sortBy: 'stockQuantity',
    sortOrder: 'asc',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch inventory
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', filters, page, limit, user?.activeBranch?.id],
    queryFn: () =>
      inventoryApi.getAllInventory({
        ...filters,
        page,
        limit,
        branchId: user?.activeBranch?.id,
      }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const getStockIcon = (
    stockQuantity: number,
    minStockLevel: number,
    reorderLevel: number
  ) => {
    if (stockQuantity <= 0) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else if (stockQuantity <= minStockLevel) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    } else if (stockQuantity <= reorderLevel) {
      return <TrendingDown className="h-5 w-5 text-orange-600" />;
    } else {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  return (
    <BranchLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stocks Available</h1>
            <p className="text-gray-600 mt-1">
              Monitor current stock levels and inventory status
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
          >
            <Filter className="h-5 w-5" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.inventories.filter(
                    (i) => i.stockQuantity > i.reorderLevel
                  ).length || 0}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reorder Level</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.inventories.filter(
                    (i) =>
                      i.stockQuantity > i.minStockLevel &&
                      i.stockQuantity <= i.reorderLevel
                  ).length || 0}
                </p>
              </div>
              <TrendingDown className="h-10 w-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.inventories.filter(
                    (i) => i.stockQuantity > 0 && i.stockQuantity <= i.minStockLevel
                  ).length || 0}
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.inventories.filter((i) => i.stockQuantity <= 0).length || 0}
                </p>
              </div>
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by part name, number..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={filters.category || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {INVENTORY_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.stockStatus || 'all'}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      stockStatus: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {STOCK_STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !data?.inventories || data.inventories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Package className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No inventory items found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Part Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Min Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reorder Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.inventories.map((item) => {
                      const stockColor = getStockStatusColor(
                        item.stockQuantity,
                        item.minStockLevel,
                        item.reorderLevel
                      );
                      const stockText = getStockStatusText(
                        item.stockQuantity,
                        item.minStockLevel,
                        item.reorderLevel
                      );

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            {getStockIcon(
                              item.stockQuantity,
                              item.minStockLevel,
                              item.reorderLevel
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.partName}
                              </div>
                              <div className="text-sm text-gray-500">{item.partNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {getCategoryLabel(item.category)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {item.stockQuantity} {getUnitLabel(item.unit)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {item.minStockLevel} {getUnitLabel(item.unit)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {item.reorderLevel} {getUnitLabel(item.unit)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                stockColor === 'green'
                                  ? 'bg-green-100 text-green-800'
                                  : stockColor === 'red'
                                  ? 'bg-red-100 text-red-800'
                                  : stockColor === 'orange'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {stockText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(page - 1) * limit + 1} to{' '}
                      {Math.min(page * limit, data.pagination.total)} of{' '}
                      {data.pagination.total} items
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === data.pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BranchLayout>
  );
}
