import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { branchInventoryApi } from '@/services/branchInventoryApi';
import { X, Package, Loader2 } from 'lucide-react';
import { BranchInventory } from '@/types';

interface EditBranchInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: BranchInventory;
  suppliers: Array<{ id: string; name: string; supplierCode: string; phone: string }>;
}

export default function EditBranchInventoryModal({
  isOpen,
  onClose,
  inventory,
  suppliers,
}: EditBranchInventoryModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    minStockLevel: inventory.minStockLevel || 0,
    maxStockLevel: inventory.maxStockLevel || 0,
    reorderLevel: inventory.reorderLevel || 0,
    supplierId: inventory.supplierId || '',
  });

  useEffect(() => {
    if (inventory) {
      setFormData({
        minStockLevel: inventory.minStockLevel || 0,
        maxStockLevel: inventory.maxStockLevel || 0,
        reorderLevel: inventory.reorderLevel || 0,
        supplierId: inventory.supplierId || '',
      });
    }
  }, [inventory]);

  const updateMutation = useMutation({
    mutationFn: () =>
      branchInventoryApi.updateBranchInventory(inventory.id, {
        minStockLevel: formData.minStockLevel || undefined,
        maxStockLevel: formData.maxStockLevel || undefined,
        reorderLevel: formData.reorderLevel || undefined,
        supplierId: formData.supplierId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-inventory'] });
      alert('Branch inventory settings updated successfully');
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update branch inventory');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    updateMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Branch Settings</h2>
              <p className="text-sm text-gray-600">
                {inventory.item?.itemName || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Note: Item details (name, prices, category) can only be edited in the Items
              Catalog. Here you can edit branch-specific stock settings.
            </p>
          </div>

          {/* Current Item Details (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Item Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Code:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {inventory.item?.itemCode}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {inventory.item?.itemCategory?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Current Stock:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {inventory.stockQuantity} {inventory.item?.itemUnit?.name || 'units'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Branch:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {inventory.branch?.name || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Stock Level Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Stock Level Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    setFormData({
                      ...formData,
                      minStockLevel: parseFloat(e.target.value) || 0,
                    })
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
                    setFormData({
                      ...formData,
                      maxStockLevel: parseFloat(e.target.value) || 0,
                    })
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
                    setFormData({
                      ...formData,
                      reorderLevel: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Supplier */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Supplier
              </label>
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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Package className="h-5 w-5" />
                  Update Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
