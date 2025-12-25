import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { dashboardApi } from '@/services/dashboardApi';

interface InventoryTabProps {
  branchId: string;
}

export default function InventoryTab({ branchId }: InventoryTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['branchInventory', branchId],
    queryFn: () => dashboardApi.getBranchInventoryReport(branchId),
    enabled: !!branchId,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const { summary, lowStockItems, outOfStockItems, recentMovements, pendingOrders } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {summary.totalItems}
              </p>
            </div>
            <Package className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">
                {summary.lowStock}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-600 opacity-50" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Out of Stock</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {summary.outOfStock}
              </p>
            </div>
            <Package className="w-10 h-10 text-red-600 opacity-50" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                ₹{summary.totalValue.toLocaleString()}
              </p>
            </div>
            <Package className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-900">Low Stock Items</h3>
          </div>
          <div className="space-y-2">
            {lowStockItems.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">{item.itemName}</div>
                  <div className="text-sm text-gray-500">
                    Current: {item.currentStock} • Min: {item.minLevel}
                  </div>
                </div>
                <span className="text-sm text-yellow-600 font-medium">
                  Reorder needed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Out of Stock Alert */}
      {outOfStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Out of Stock Items</h3>
          </div>
          <div className="space-y-2">
            {outOfStockItems.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">{item.itemName}</div>
                  <div className="text-sm text-gray-500">Last updated: {new Date(item.lastUpdated).toLocaleDateString()}</div>
                </div>
                <span className="text-sm text-red-600 font-medium">
                  Urgent
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Stock Movements */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Stock Movements</h3>
        <div className="space-y-3">
          {recentMovements.map((movement: any) => (
            <div
              key={movement.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  movement.type === 'IN' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {movement.type === 'IN' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{movement.itemName}</div>
                  <div className="text-sm text-gray-500">
                    {movement.type} • {new Date(movement.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  movement.type === 'IN' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                </div>
                <div className="text-xs text-gray-500">
                  By {movement.userName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Purchase Orders */}
      {pendingOrders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Pending Purchase Orders</h3>
          <div className="space-y-3">
            {pendingOrders.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
              >
                <div>
                  <div className="font-medium text-gray-900">Order #{order.orderNumber}</div>
                  <div className="text-sm text-gray-500">
                    {order.supplier} • {order.items} items
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ₹{order.total.toLocaleString()}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
