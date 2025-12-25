import { useEffect, useState } from 'react';
import { X, Package, DollarSign, Tag, FileText, Boxes } from 'lucide-react';
import { Item } from '@/types';
import { itemsApi } from '@/services/itemsApi';

interface ViewItemModalProps {
  itemId: string;
  onClose: () => void;
}

const formatCurrency = (value?: number) => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(value);
};

export default function ViewItemModal({ itemId, onClose }: ViewItemModalProps) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const data = await itemsApi.getItemById(itemId);
        setItem(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <p className="text-red-600 mb-4">{error || 'Item not found'}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Item Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Item Name</label>
                  <p className="text-gray-900 font-medium mt-1">{item.itemName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Item Code</label>
                  <p className="text-gray-900 font-medium mt-1">{item.itemCode}</p>
                </div>
                {item.modelVariant && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Model Variant</label>
                    <p className="text-gray-900 mt-1">{item.modelVariant}</p>
                  </div>
                )}
                {item.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-900 mt-1">{item.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Category & Brand */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-600" />
                Category & Brand
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900 mt-1">{item.itemCategory?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Brand</label>
                  <p className="text-gray-900 mt-1">{item.itemBrand?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Model</label>
                  <p className="text-gray-900 mt-1">{item.itemModel?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Pricing & Tax
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Price</label>
                  <p className="text-gray-900 font-semibold text-lg mt-1">
                    {formatCurrency(item.purchasePrice)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sales Price</label>
                  <p className="text-green-600 font-semibold text-lg mt-1">
                    {formatCurrency(item.salesPrice)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">HSN Code</label>
                  <p className="text-gray-900 mt-1">{item.hsnCode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">GST Rate</label>
                  <p className="text-gray-900 mt-1">
                    {item.itemGSTRate ? `${item.itemGSTRate.rate}% - ${item.itemGSTRate.name}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tax Type</label>
                  <p className="text-gray-900 mt-1">{item.taxType || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Unit</label>
                  <p className="text-gray-900 mt-1">
                    {item.itemUnit ? `${item.itemUnit.name} (${item.itemUnit.symbol})` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Boxes className="h-5 w-5 text-blue-600" />
                Branch-wise Stock Information
              </h3>

              {item.branchInventories && item.branchInventories.length > 0 ? (
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Branch</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Stock Qty {item.itemUnit && `(${item.itemUnit.symbol || item.itemUnit.name})`}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Min Level</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Reorder Level</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Max Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {item.branchInventories.map((inventory) => (
                        <tr key={inventory.id} className="hover:bg-gray-100">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{inventory.branch.name}</div>
                            <div className="text-xs text-gray-500">{inventory.branch.code}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${
                              inventory.stockQuantity <= (inventory.minStockLevel || 0)
                                ? 'text-red-600'
                                : inventory.stockQuantity <= (inventory.reorderLevel || 0)
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}>
                              {inventory.stockQuantity.toString()}
                            </span>
                            {item.itemUnit && (
                              <span className="text-xs text-gray-500 ml-1">
                                {item.itemUnit.symbol || item.itemUnit.name}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {inventory.minStockLevel?.toString() || '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {inventory.reorderLevel?.toString() || '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {inventory.maxStockLevel?.toString() || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                          Total Stock ({item.branchInventories.length} branch{item.branchInventories.length !== 1 ? 'es' : ''})
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {item.branchInventories.reduce((sum, inv) => sum + Number(inv.stockQuantity), 0)}
                          {item.itemUnit && (
                            <span className="text-sm text-gray-600 ml-1">
                              {item.itemUnit.symbol || item.itemUnit.name}
                            </span>
                          )}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <Boxes className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No stock available in any branch</p>
                </div>
              )}

              {item._count?.purchaseOrderItems !== undefined && item._count.purchaseOrderItems > 0 && (
                <div className="mt-4 bg-blue-50 rounded-lg p-4">
                  <label className="text-sm font-medium text-blue-700">Purchase Orders</label>
                  <p className="text-blue-900 font-semibold text-lg mt-1">
                    {item._count.purchaseOrderItems} order{item._count.purchaseOrderItems !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
