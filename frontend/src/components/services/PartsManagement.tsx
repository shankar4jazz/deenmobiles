import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi, BranchInventoryPart, ApprovalMethod } from '@/services/serviceApi';
import { Package, Plus, Trash2, AlertCircle, Search, X, Minus, Pencil, Check, CheckCircle, Clock, Phone, MessageCircle, User, MessageSquare } from 'lucide-react';

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

  // Approval state
  const [approvingPartId, setApprovingPartId] = useState<string | null>(null);
  const [approvalMethod, setApprovalMethod] = useState<ApprovalMethod>('PHONE_CALL');
  const [approvalNote, setApprovalNote] = useState('');

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

  // Approve part mutation
  const approvePartMutation = useMutation({
    mutationFn: ({ partId, data }: { partId: string; data: { approvalMethod: ApprovalMethod; approvalNote?: string } }) =>
      serviceApi.approveServicePart(serviceId, partId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      setApprovingPartId(null);
      setApprovalMethod('PHONE_CALL');
      setApprovalNote('');
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

  // Handle approve part
  const handleApprove = (partId: string) => {
    approvePartMutation.mutate({
      partId,
      data: {
        approvalMethod,
        approvalNote: approvalNote || undefined,
      },
    });
  };

  // Approval method options
  const approvalMethods: { value: ApprovalMethod; label: string; icon: React.ReactNode }[] = [
    { value: 'PHONE_CALL', label: 'Phone Call', icon: <Phone className="h-4 w-4" /> },
    { value: 'WHATSAPP', label: 'WhatsApp', icon: <MessageCircle className="h-4 w-4" /> },
    { value: 'IN_PERSON', label: 'In Person', icon: <User className="h-4 w-4" /> },
    { value: 'SMS', label: 'SMS', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  // Get approval method label
  const getApprovalMethodLabel = (method: string) => {
    const found = approvalMethods.find((m) => m.value === method);
    return found?.label || method;
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
            onClick={() => {
              const newState = !showAddPart;
              setShowAddPart(newState);
              if (newState) setShowDropdown(true);
            }}
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Approval
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
                    <td className="px-4 py-3">
                      {part.isApproved ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3" />
                            Approved
                          </span>
                          <span className="text-xs text-gray-500">
                            {getApprovalMethodLabel(part.approvalMethod)}
                          </span>
                        </div>
                      ) : approvingPartId === part.id ? (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg min-w-[200px]">
                          <div className="text-sm font-medium text-gray-700 mb-2">Approve Part</div>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Method</label>
                              <select
                                value={approvalMethod}
                                onChange={(e) => setApprovalMethod(e.target.value as ApprovalMethod)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              >
                                {approvalMethods.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. Spoke with customer at 3pm"
                                value={approvalNote}
                                onChange={(e) => setApprovalNote(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleApprove(part.id)}
                                disabled={approvePartMutation.isPending}
                                className="flex-1 px-2 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {approvePartMutation.isPending ? 'Approving...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => {
                                  setApprovingPartId(null);
                                  setApprovalNote('');
                                }}
                                className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => setApprovingPartId(part.id)}
                              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                            >
                              Approve
                            </button>
                          )}
                        </div>
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
      {(addPartMutation.isError || updatePartMutation.isError || approvePartMutation.isError) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>
            {(addPartMutation.error as any)?.response?.data?.message ||
             (updatePartMutation.error as any)?.response?.data?.message ||
             (approvePartMutation.error as any)?.response?.data?.message ||
             'Failed to update part'}
          </span>
        </div>
      )}
    </div>
  );
}
