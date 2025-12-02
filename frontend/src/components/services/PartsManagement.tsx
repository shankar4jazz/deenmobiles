import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi, BranchInventoryPart } from '@/services/serviceApi';
import { Package, Plus, Trash2, AlertCircle, Search, X, Minus, Pencil, Check } from 'lucide-react';

interface PartsManagementProps {
  serviceId: string;
  parts: any[];
  canEdit: boolean;
}

export default function PartsManagement({ serviceId, parts, canEdit }: PartsManagementProps) {
  const queryClient = useQueryClient();
  const [showAddPart, setShowAddPart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState<BranchInventoryPart | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Edit state
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editUnitPrice, setEditUnitPrice] = useState(0);

  // Fetch available parts from branch inventory (shows most used by default)
  const { data: availableParts = [], isLoading: isLoadingParts } = useQuery({
    queryKey: ['available-parts', serviceId, searchQuery],
    queryFn: () => serviceApi.getAvailableParts(serviceId, searchQuery || undefined),
    enabled: showAddPart && !selectedPart,
  });

  // Add part mutation
  const addPartMutation = useMutation({
    mutationFn: (data: { branchInventoryId: string; quantity: number; unitPrice: number }) =>
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

  // Update part mutation
  const updatePartMutation = useMutation({
    mutationFn: ({ partId, data }: { partId: string; data: { quantity?: number; unitPrice?: number } }) =>
      serviceApi.updateServicePart(serviceId, partId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      setEditingPartId(null);
    },
  });

  const handleSelectPart = (part: BranchInventoryPart) => {
    setSelectedPart(part);
    setUnitPrice(Number(part.item.salesPrice) || 0);
    setSearchQuery('');
  };

  const handleAddPart = () => {
    if (!selectedPart) return;

    addPartMutation.mutate({
      branchInventoryId: selectedPart.id,
      quantity,
      unitPrice,
    });
  };

  // Handle quantity +/- buttons
  const handleQuantityChange = (partId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    updatePartMutation.mutate({
      partId,
      data: { quantity: newQty },
    });
  };

  // Start editing a part
  const startEditing = (part: any) => {
    setEditingPartId(part.id);
    setEditQuantity(part.quantity);
    setEditUnitPrice(part.unitPrice);
  };

  // Save edit
  const saveEdit = (partId: string) => {
    updatePartMutation.mutate({
      partId,
      data: { quantity: editQuantity, unitPrice: editUnitPrice },
    });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingPartId(null);
  };

  // Helper function to get part name (handles both new and legacy data)
  const getPartName = (part: any) => {
    if (part.item?.itemName) return part.item.itemName;
    if (part.part?.name) return part.part.name;
    return 'Unknown Part';
  };

  // Helper function to get part code (handles both new and legacy data)
  const getPartCode = (part: any) => {
    if (part.item?.itemCode) return part.item.itemCode;
    if (part.part?.partNumber) return part.part.partNumber;
    return null;
  };

  const totalPartsValue = parts.reduce((sum, part) => sum + part.totalPrice, 0);
  const stockQuantity = selectedPart ? Number(selectedPart.stockQuantity) : 0;

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
                    placeholder="Search or select from most used items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Parts Dropdown - shows most used by default or search results */}
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoadingParts ? (
                      <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : availableParts.length > 0 ? (
                      <>
                        {!searchQuery && (
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
                            Most Used Items
                          </div>
                        )}
                        {availableParts.map((part) => (
                          <button
                            key={part.id}
                            type="button"
                            onClick={() => {
                              handleSelectPart(part);
                              setShowDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-gray-900">{part.item.itemName}</div>
                            <div className="text-sm text-gray-500">
                              {part.item.itemCode && <span className="mr-2">{part.item.itemCode}</span>}
                              Stock: {Number(part.stockQuantity)} | Price: ₹{Number(part.item.salesPrice) || 0}
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        {searchQuery ? 'No parts found in branch inventory' : 'No items available'}
                      </div>
                    )}
                  </div>
                )}

                {/* Click outside to close dropdown */}
                {showDropdown && (
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowDropdown(false)}
                  />
                )}
              </div>
            ) : (
              <div className="p-4 bg-white border border-purple-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{selectedPart.item.itemName}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedPart.item.itemCode && <span className="mr-2">{selectedPart.item.itemCode}</span>}
                      Available Stock: {stockQuantity}
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
                      max={stockQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {quantity > stockQuantity && (
                      <p className="text-xs text-red-600 mt-1">
                        Insufficient stock! Only {stockQuantity} available.
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
                  disabled={addPartMutation.isPending || quantity > stockQuantity || quantity < 1}
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Price
                  </th>
                  {canEdit && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {getPartName(part)}
                      {getPartCode(part) && (
                        <span className="text-xs text-gray-500 block">
                          {getPartCode(part)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {editingPartId === part.id ? (
                        <input
                          type="number"
                          min="1"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      ) : canEdit ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleQuantityChange(part.id, part.quantity, -1)}
                            disabled={part.quantity <= 1 || updatePartMutation.isPending}
                            className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{part.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(part.id, part.quantity, 1)}
                            disabled={updatePartMutation.isPending}
                            className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded disabled:opacity-30"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-center block">{part.quantity}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {editingPartId === part.id ? (
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editUnitPrice}
                            onChange={(e) => setEditUnitPrice(parseFloat(e.target.value) || 0)}
                            className="w-24 pl-5 pr-2 py-1 border border-gray-300 rounded"
                          />
                        </div>
                      ) : (
                        <span>₹{part.unitPrice.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {editingPartId === part.id ? (
                        <span>₹{(editQuantity * editUnitPrice).toFixed(2)}</span>
                      ) : (
                        <span>₹{part.totalPrice.toFixed(2)}</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {editingPartId === part.id ? (
                            <>
                              <button
                                onClick={() => saveEdit(part.id)}
                                disabled={updatePartMutation.isPending}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                title="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(part)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to remove this part?')) {
                                    removePartMutation.mutate(part.id);
                                  }
                                }}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                disabled={removePartMutation.isPending}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
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

      {/* Error Messages */}
      {(addPartMutation.isError || updatePartMutation.isError) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>
            {(addPartMutation.error as any)?.response?.data?.message ||
             (updatePartMutation.error as any)?.response?.data?.message ||
             'Failed to update part'}
          </span>
        </div>
      )}
    </div>
  );
}
