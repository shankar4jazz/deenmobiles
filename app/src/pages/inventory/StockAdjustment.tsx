import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { branchInventoryApi } from '@/services/branchInventoryApi';
import { useAuthStore } from '@/store/authStore';
import {
  Search,
  Package,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Calendar,
  User,
  Filter,
  History,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { BranchInventory } from '@/types';
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal';

export default function StockAdjustment() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<BranchInventory | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(20);
  const [activeTab, setActiveTab] = useState<'adjust' | 'history'>('adjust');

  // Fetch branch inventory for selection
  const {
    data: inventoryData,
    isLoading: isLoadingInventory,
    isError: isInventoryError,
    error: inventoryError,
    isSuccess: isInventorySuccess
  } = useQuery({
    queryKey: ['branch-inventory', user?.activeBranch?.id],
    queryFn: () => {
      console.log('🔍 [StockAdjustment] Fetching inventory with params:', {
        page: 1,
        limit: 1000,
        branchId: user?.activeBranch?.id,
      });
      return branchInventoryApi.getAllBranchInventories({
        page: 1,
        limit: 1000,
        branchId: user?.activeBranch?.id,
      });
    },
    enabled: !!user?.activeBranch?.id,
    retry: 1,
  });

  // Fetch stock movements history
  const {
    data: movementsData,
    isLoading: isLoadingMovements,
    isError: isMovementsError,
    error: movementsError,
    isSuccess: isMovementsSuccess
  } = useQuery({
    queryKey: ['stock-movements-history', user?.activeBranch?.id, historyPage],
    queryFn: () => {
      console.log('🔍 [StockAdjustment] Fetching stock movements with params:', {
        branchId: user?.activeBranch?.id,
        page: historyPage,
        limit: historyLimit,
      });
      return branchInventoryApi.getAllStockMovements({
        branchId: user?.activeBranch?.id,
        page: historyPage,
        limit: historyLimit,
      });
    },
    enabled: !!user?.activeBranch?.id,
    retry: 1,
  });

  // Log component mount and user info
  useEffect(() => {
    console.log('📋 [StockAdjustment] Component mounted');
    console.log('👤 [StockAdjustment] User info:', user);
    console.log('🏢 [StockAdjustment] Active Branch ID:', user?.activeBranch?.id);
    console.log('🏢 [StockAdjustment] Active Branch Name:', user?.activeBranch?.name);
  }, []);

  // Log inventory query results
  useEffect(() => {
    if (isInventorySuccess && inventoryData) {
      console.log('✅ [StockAdjustment] Inventory query successful. Data:', inventoryData);
      console.log('📊 [StockAdjustment] Inventory count:', inventoryData.inventories?.length || 0);
    }
    if (isInventoryError) {
      console.error('❌ [StockAdjustment] Inventory query error:', inventoryError);
    }
  }, [isInventorySuccess, isInventoryError, inventoryData, inventoryError]);

  // Log movements query results
  useEffect(() => {
    if (isMovementsSuccess && movementsData) {
      console.log('✅ [StockAdjustment] Movements query successful. Data:', movementsData);
      console.log('📊 [StockAdjustment] Movements count:', movementsData.movements?.length || 0);
    }
    if (isMovementsError) {
      console.error('❌ [StockAdjustment] Movements query error:', movementsError);
    }
  }, [isMovementsSuccess, isMovementsError, movementsData, movementsError]);

  const handleAdjustStock = (inventory: BranchInventory) => {
    setSelectedInventory(inventory);
    setShowAdjustModal(true);
  };

  const filteredInventory = inventoryData?.inventories.filter((item) =>
    searchTerm
      ? item.item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Adjustment</h1>
            <p className="text-gray-600 mt-1">
              Adjust inventory stock levels and view adjustment history
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

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-1">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('adjust')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'adjust'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className="h-5 w-5" />
              Adjust Stock
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <History className="h-5 w-5" />
              Adjustment History
            </button>
          </div>
        </div>

        {/* Info Card - Only show on Adjust tab */}
        {activeTab === 'adjust' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <RefreshCw className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Stock Adjustment Guidelines
              </h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Use positive values to increase stock (returns, purchases)
                </li>
                <li className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Use negative values to decrease stock (sales, damages, service use)
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  All adjustments are logged with timestamp and reason
                </li>
                <li className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  Audit trail includes user information for compliance
                </li>
              </ul>
            </div>
          </div>
        </div>
        )}

        {/* Adjust Stock Tab Content */}
        {activeTab === 'adjust' && (
          <div className="space-y-6">
            {/* Filters */}
            {showFilters && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by item name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Inventory List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {!filteredInventory || filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Package className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No inventory items found</p>
              <p className="text-sm">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Add inventory items to manage stock levels'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Info
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInventory.map((item) => {
                    const isLowStock = item.stockQuantity <= item.minStockLevel;
                    const needsReorder =
                      item.stockQuantity > item.minStockLevel &&
                      item.stockQuantity <= item.reorderLevel;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.item.itemName}
                            </div>
                            <div className="text-sm text-gray-500">{item.item.itemCode}</div>
                            {item.item.itemBrand && (
                              <div className="text-xs text-gray-400">
                                Brand: {item.item.itemBrand.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-lg font-bold ${
                                isLowStock
                                  ? 'text-red-600'
                                  : needsReorder
                                  ? 'text-orange-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {item.stockQuantity}
                            </span>
                            <span className="text-sm text-gray-600">
                              {item.item.itemUnit?.name || 'units'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {item.minStockLevel} {item.item.itemUnit?.name || 'units'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {item.reorderLevel} {item.item.itemUnit?.name || 'units'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleAdjustStock(item)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-purple-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Stock Adjustment History</h2>
                <p className="text-sm text-gray-600">Track all stock movements and changes</p>
              </div>
            </div>
          </div>

          {isLoadingMovements ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : !movementsData?.movements || movementsData.movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <History className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No stock movements found</p>
              <p className="text-sm">Stock adjustments will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Movement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {movementsData.movements.map((movement: any) => {
                    const isIncrease = Number(movement.newQty) > Number(movement.previousQty);
                    const formattedDate = new Date(movement.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                    const formattedTime = new Date(movement.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    // Format movement type with color coding
                    const getMovementTypeColor = (type: string) => {
                      switch (type) {
                        case 'ADJUSTMENT':
                          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                        case 'PURCHASE':
                          return 'bg-green-100 text-green-800 border-green-200';
                        case 'SALE':
                          return 'bg-blue-100 text-blue-800 border-blue-200';
                        case 'TRANSFER':
                          return 'bg-purple-100 text-purple-800 border-purple-200';
                        case 'DAMAGE':
                          return 'bg-red-100 text-red-800 border-red-200';
                        case 'RETURN':
                          return 'bg-indigo-100 text-indigo-800 border-indigo-200';
                        default:
                          return 'bg-gray-100 text-gray-800 border-gray-200';
                      }
                    };

                    const formatMovementType = (type: string) => {
                      return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                    };

                    return (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
                              <div className="text-xs text-gray-500">{formattedTime}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {movement.branchInventory?.item?.itemName || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">{movement.branchInventory?.item?.itemCode || 'N/A'}</div>
                            {movement.branchInventory?.item?.itemBrand && (
                              <div className="text-xs text-gray-400 mt-1">
                                Brand: {movement.branchInventory.item.itemBrand.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getMovementTypeColor(movement.movementType)}`}>
                            {formatMovementType(movement.movementType)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {isIncrease ? (
                              <ArrowUp className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowDown className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">{movement.previousQty}</span>
                                <span className="text-gray-400">→</span>
                                <span className={`text-lg font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                  {movement.newQty}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {isIncrease ? '+' : ''}{Number(movement.quantity).toFixed(2)} {movement.branchInventory?.item?.itemUnit?.name || 'units'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {movement.user?.name || 'Unknown User'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {movement.user?.customRole?.name || movement.user?.role || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {movement.notes ? (
                            <div className="bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                              <div className="text-xs text-blue-600 font-medium mb-1">Reason</div>
                              <div className="text-sm text-gray-900">{movement.notes}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No notes</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {movementsData.pagination && movementsData.pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(historyPage - 1) * historyLimit + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(historyPage * historyLimit, movementsData.pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{movementsData.pagination.total}</span> movements
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                        disabled={historyPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setHistoryPage((prev) => Math.min(movementsData.pagination.totalPages, prev + 1))}
                        disabled={historyPage === movementsData.pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedInventory && (
        <StockAdjustmentModal
          isOpen={showAdjustModal}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedInventory(null);
          }}
          inventoryId={selectedInventory.id}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ['branch-inventory'],
              exact: false,
              refetchType: 'all'
            });
            queryClient.invalidateQueries({
              queryKey: ['stock-movements-history'],
              exact: false,
              refetchType: 'all'
            });
            setShowAdjustModal(false);
            setSelectedInventory(null);
          }}
        />
      )}
    </>
  );
}
