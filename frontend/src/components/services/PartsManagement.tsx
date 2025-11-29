import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '@/services/serviceApi';
import { Inventory } from '@/types';
import { Package, Plus, Trash2, AlertCircle, Search, X } from 'lucide-react';
import { api } from '@/services/api';

interface PartsManagementProps {
  serviceId: string;
  parts: any[];
  canEdit: boolean;
}

export default function PartsManagement({ serviceId, parts, canEdit }: PartsManagementProps) {
  const queryClient = useQueryClient();
  const [showAddPart, setShowAddPart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState<Inventory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  // Fetch available inventory
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', searchQuery],
    queryFn: async () => {
      const response = await api.get(`/inventory?search=${searchQuery}&limit=10`);
      return response.data.data;
    },
    enabled: showAddPart && searchQuery.length > 0,
  });

  // Add part mutation
  const addPartMutation = useMutation({
    mutationFn: (data: { partId: string; quantity: number; unitPrice: number }) =>
      serviceApi.addServicePart(serviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      setShowAddPart(false);
      setSelectedPart(null);
      setSearchQuery('');
      setQuantity(1);
      setUnitPrice(0);
    },
  });

  // Remove part mutation
  const removePartMutation = useMutation({
    mutationFn: (partId: string) => serviceApi.removeServicePart(serviceId, partId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
    },
  });

  const handleSelectPart = (part: Inventory) => {
    setSelectedPart(part);
    setUnitPrice(part.sellingPrice || 0);
    setSearchQuery('');
  };

  const handleAddPart = () => {
    if (!selectedPart) return;

    addPartMutation.mutate({
      partId: selectedPart.id,
      quantity,
      unitPrice,
    });
  };

  const totalPartsValue = parts.reduce((sum, part) => sum + part.totalPrice, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Parts Used</h3>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddPart(!showAddPart)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Part
          </button>
        )}
      </div>

      {/* Add Part Form */}
      {showAddPart && canEdit && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Add New Part</h4>
            <button
              onClick={() => {
                setShowAddPart(false);
                setSelectedPart(null);
                setSearchQuery('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Part Search */}
            {!selectedPart ? (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Part/Item <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Search Results Dropdown */}
                {searchQuery && inventoryData?.inventories?.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {inventoryData.inventories.map((item: Inventory) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectPart(item)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <div className="font-medium text-gray-900">{item.item?.name}</div>
                        <div className="text-sm text-gray-500">
                          Stock: {item.quantity} | Price: ₹{item.sellingPrice}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-white border border-purple-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{selectedPart.item?.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Available Stock: {selectedPart.quantity}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPart(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedPart.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {quantity > selectedPart.quantity && (
                      <p className="text-xs text-red-600 mt-1">
                        Insufficient stock! Only {selectedPart.quantity} available.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{(quantity * unitPrice).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddPart}
                  disabled={addPartMutation.isPending || quantity > selectedPart.quantity || quantity < 1}
                  className="w-full mt-4 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addPartMutation.isPending ? 'Adding Part...' : 'Add Part to Service'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Parts List */}
      {parts.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No parts added yet</p>
          {canEdit && (
            <p className="text-sm text-gray-400 mt-1">Click "Add Part" to add parts to this service</p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Part Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Price
                  </th>
                  {canEdit && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {part.part?.name}
                      {part.part?.partNumber && (
                        <span className="text-xs text-gray-500 block">
                          {part.part.partNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{part.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ₹{part.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ₹{part.totalPrice.toFixed(2)}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove this part?')) {
                              removePartMutation.mutate(part.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          disabled={removePartMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Parts Value:</span>
              <span className="text-xl font-bold text-purple-600">
                ₹{totalPartsValue.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Stock Warning */}
      {addPartMutation.isError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{(addPartMutation.error as any)?.response?.data?.message || 'Failed to add part'}</span>
        </div>
      )}
    </div>
  );
}
