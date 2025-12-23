import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchInventoryApi } from '@/services/branchInventoryApi';
import { supplierApi } from '@/services/supplierApi';
import { BranchInventoryFilters, BranchInventory } from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  RefreshCw,
  Filter,
} from 'lucide-react';
import {
  STOCK_STATUS_OPTIONS,
  formatCurrency,
  getStockStatusColor,
  getStockStatusText,
} from '@/constants/inventory';
import AddItemToBranchModal from '@/components/inventory/AddItemToBranchModal';
import EditBranchInventoryModal from '@/components/inventory/EditBranchInventoryModal';
import BranchInventoryDetailsModal from '@/components/inventory/BranchInventoryDetailsModal';
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal';

export default function InventoryList() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<BranchInventoryFilters>({
    search: '',
    stockStatus: 'all',
    isActive: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<BranchInventory | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch branch inventory - filtered by active branch
  const { data, isLoading, isError, error, isSuccess } = useQuery({
    queryKey: ['branch-inventory', filters, page, limit, user?.activeBranch?.id],
    queryFn: () => {
      console.log('🔍 [InventoryList] Fetching branch inventory with params:', {
        filters,
        page,
        limit,
        branchId: user?.activeBranch?.id
      });
      return branchInventoryApi.getAllBranchInventories({
        ...filters,
        page,
        limit,
        branchId: user?.activeBranch?.id
      });
    },
    staleTime: 1 * 60 * 1000, // 1 minute - inventory changes more frequently
  });

  // Log component mount and user info
  useEffect(() => {
    console.log('📦 [InventoryList] Component mounted');
    console.log('👤 [InventoryList] User info:', user);
    console.log('🏢 [InventoryList] Active Branch ID:', user?.activeBranch?.id);
    console.log('🏢 [InventoryList] Active Branch Name:', user?.activeBranch?.name);
  }, []);

  // Log query results
  useEffect(() => {
    if (isSuccess && data) {
      console.log('✅ [InventoryList] Query successful. Data:', data);
      console.log('📊 [InventoryList] Inventory count:', data.inventories?.length || 0);
    }
    if (isError) {
      console.error('❌ [InventoryList] Query error:', error);
    }
  }, [isSuccess, isError, data, error]);

  // Fetch suppliers for dropdown
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-dropdown', user?.activeBranch?.id],
    queryFn: () => supplierApi.getSuppliersDropdown(user?.activeBranch?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: branchInventoryApi.removeItemFromBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-inventory'] });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to remove "${name}" from this branch? Stock will be removed from this location.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(id);
        alert('Item removed from branch successfully');
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to remove item from branch');
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleEdit = (inventory: BranchInventory) => {
    setSelectedInventory(inventory);
    setShowEditModal(true);
  };

  const handleViewDetails = (inventory: BranchInventory) => {
    setSelectedInventory(inventory);
    setShowDetailsModal(true);
  };

  const handleAdjustStock = (inventory: BranchInventory) => {
    setSelectedInventory(inventory);
    setShowStockModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branch Stock Management</h1>
            <p className="text-gray-600 mt-1">
              {user?.activeBranch?.name ? `Stock levels for ${user.activeBranch.name}` : 'Track branch-specific stock levels'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
            >
              <Filter className="h-5 w-5" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Add Item to Branch
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by item name, code, HSN..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

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

              <div className="flex justify-end items-center">
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
              <p className="text-lg font-medium">No branch stock items found</p>
              <p className="text-sm">Add items to your branch inventory to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Part Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category/Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        HSN/GST
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.item.itemName}
                              </div>
                              <div className="text-sm text-gray-500">{item.item.itemCode}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm text-gray-900">
                                {item.item.itemCategory?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.item.itemBrand?.name || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {item.stockQuantity} {item.item.itemUnit?.name || 'units'}
                              </span>
                              {stockColor !== 'green' && (
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    stockColor === 'red'
                                      ? 'bg-red-100 text-red-800'
                                      : stockColor === 'orange'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {stockText}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(item.item.purchasePrice)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.item.salesPrice)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm text-gray-900">{item.item.hsnCode}</div>
                              <div className="text-sm text-gray-500">
                                GST: {item.item.itemGSTRate?.rate || 0}%
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewDetails(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleAdjustStock(item)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Adjust Stock"
                              >
                                <RefreshCw className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, item.item.itemName)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
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

      {/* Modals */}
      {showAddModal && (
        <AddItemToBranchModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          suppliers={suppliers || []}
        />
      )}

      {showEditModal && selectedInventory && (
        <EditBranchInventoryModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedInventory(null);
          }}
          inventory={selectedInventory}
          suppliers={suppliers || []}
        />
      )}

      {showDetailsModal && selectedInventory && (
        <BranchInventoryDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedInventory(null);
          }}
          inventory={selectedInventory}
        />
      )}

      {showStockModal && selectedInventory && (
        <StockAdjustmentModal
          isOpen={showStockModal}
          onClose={() => {
            setShowStockModal(false);
            setSelectedInventory(null);
          }}
          inventoryId={selectedInventory.id}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ['inventory-all'],
              exact: false,
              refetchType: 'all'
            });
            queryClient.invalidateQueries({
              queryKey: ['inventory'],
              exact: false,
              refetchType: 'all'
            });
          }}
        />
      )}
    </>
  );
}
