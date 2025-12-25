import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchInventoryApi } from '@/services/branchInventoryApi';
import { itemsApi } from '@/services/itemsApi';
import { X, Package, Loader2, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface AddItemToBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Array<{ id: string; name: string; supplierCode: string; phone: string }>;
}

export default function AddItemToBranchModal({
  isOpen,
  onClose,
  suppliers,
}: AddItemToBranchModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const activeBranchId = user?.activeBranch?.id || user?.branchId || '';

  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    itemId: '',
    stockQuantity: 0,
    minStockLevel: 5,
    maxStockLevel: 100,
    reorderLevel: 10,
    supplierId: '',
    lastPurchasePrice: undefined as number | undefined,
    lastPurchaseDate: '',
  });

  // Fetch items from catalog
  const { data: itemsData } = useQuery({
    queryKey: ['items-catalog', searchTerm],
    queryFn: () => itemsApi.getAllItems({
      search: searchTerm,
      limit: 100,
      isActive: true
    }),
  });

  const createMutation = useMutation({
    mutationFn: branchInventoryApi.addItemToBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-inventory'] });
      alert('Item added to branch successfully');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to add item to branch');
    },
  });

  const resetForm = () => {
    setFormData({
      itemId: '',
      stockQuantity: 0,
      minStockLevel: 5,
      maxStockLevel: 100,
      reorderLevel: 10,
      supplierId: '',
      lastPurchasePrice: undefined,
      lastPurchaseDate: '',
    });
    setSearchTerm('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.itemId) {
      setError('Please select an item');
      return;
    }

    if (!activeBranchId) {
      setError('No active branch selected');
      return;
    }

    createMutation.mutate({
      itemId: formData.itemId,
      branchId: activeBranchId,
      stockQuantity: formData.stockQuantity,
      minStockLevel: formData.minStockLevel || undefined,
      maxStockLevel: formData.maxStockLevel || undefined,
      reorderLevel: formData.reorderLevel || undefined,
      supplierId: formData.supplierId || undefined,
      lastPurchasePrice: formData.lastPurchasePrice,
      lastPurchaseDate: formData.lastPurchaseDate ? new Date(formData.lastPurchaseDate) : undefined,
    });
  };

  // Get selected item details
  const selectedItem = itemsData?.items?.find(item => item.id === formData.itemId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Item to Branch</h2>
              <p className="text-sm text-gray-600">
                Select an item from catalog and set stock levels
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Select Item from Catalog */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Item from Catalog
            </h3>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items by name, code, HSN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Item Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.itemId}
                onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select an item</option>
                {itemsData?.items?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.itemCode} - {item.itemName}
                    {item.itemBrand?.name && ` (${item.itemBrand.name})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Item Details */}
            {selectedItem && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Item Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-600">Code:</span>
                    <span className="ml-2 font-medium text-blue-900">{selectedItem.itemCode}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Category:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {selectedItem.itemCategory?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Brand:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {selectedItem.itemBrand?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Unit:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {selectedItem.itemUnit?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Purchase Price:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      ₹{selectedItem.purchasePrice ? Number(selectedItem.purchasePrice).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Sales Price:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      ₹{selectedItem.salesPrice ? Number(selectedItem.salesPrice).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stock Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reorder Level
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Stock Level
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Stock Level
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxStockLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, maxStockLevel: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Purchase Information (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.supplierCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Purchase Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.lastPurchasePrice ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lastPurchasePrice: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.lastPurchaseDate}
                  onChange={(e) => setFormData({ ...formData, lastPurchaseDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Package className="h-5 w-5" />
                  Add to Branch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
