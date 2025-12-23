import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi, BranchInventoryPart, ApprovalMethod } from '@/services/serviceApi';
import { Package, Plus, Trash2, AlertCircle, Search, X, Minus, Pencil, Check, CheckCircle, Clock, Phone, MessageCircle, User, MessageSquare, Tag, ShoppingBag } from 'lucide-react';

interface FaultWithTags {
  fault?: {
    id: string;
    name: string;
    tags?: string;
    defaultPrice?: number;
  };
  faultId: string;
}

interface PartsManagementProps {
  serviceId: string;
  parts: any[];
  faults: FaultWithTags[];
  canEdit: boolean;
  onExtraSpareUpdate?: (amount: number) => void;
}

export default function PartsManagement({ serviceId, parts, faults, canEdit, onExtraSpareUpdate }: PartsManagementProps) {
  const queryClient = useQueryClient();

  // Get unique tags from all faults
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    faults.forEach((f) => {
      if (f.fault?.tags) {
        f.fault.tags.split(',').forEach((tag) => {
          const trimmed = tag.trim().toLowerCase();
          if (trimmed) tags.add(trimmed);
        });
      }
    });
    return Array.from(tags).sort();
  }, [faults]);

  // Separate tagged parts from extra spare parts
  const { taggedParts, extraSpareParts } = useMemo(() => {
    const tagged: any[] = [];
    const extra: any[] = [];
    parts.forEach((part) => {
      if (part.isExtraSpare) {
        extra.push(part);
      } else {
        tagged.push(part);
      }
    });
    return { taggedParts: tagged, extraSpareParts: extra };
  }, [parts]);

  // Group tagged parts by their faultTag
  const partsByTag = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    uniqueTags.forEach((tag) => {
      grouped[tag] = taggedParts.filter((p) => p.faultTag?.toLowerCase() === tag);
    });
    return grouped;
  }, [taggedParts, uniqueTags]);

  // State for adding tagged parts (per tag)
  const [activeTagForm, setActiveTagForm] = useState<string | null>(null);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagSelectedPart, setTagSelectedPart] = useState<BranchInventoryPart | null>(null);
  const [tagQuantity, setTagQuantity] = useState(1);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // State for extra spare parts
  const [showExtraSpareForm, setShowExtraSpareForm] = useState(false);
  const [extraSearchQuery, setExtraSearchQuery] = useState('');
  const [extraSelectedPart, setExtraSelectedPart] = useState<BranchInventoryPart | null>(null);
  const [extraQuantity, setExtraQuantity] = useState(1);
  const [extraUnitPrice, setExtraUnitPrice] = useState(0);
  const [showExtraDropdown, setShowExtraDropdown] = useState(false);

  // Edit state
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editUnitPrice, setEditUnitPrice] = useState(0);

  // Approval state
  const [approvingPartId, setApprovingPartId] = useState<string | null>(null);
  const [approvalMethod, setApprovalMethod] = useState<ApprovalMethod>('PHONE_CALL');
  const [approvalNote, setApprovalNote] = useState('');

  // Fetch available parts for tagged section
  const { data: tagAvailableParts = [], isLoading: isLoadingTagParts } = useQuery({
    queryKey: ['available-parts', serviceId, tagSearchQuery, 'tagged'],
    queryFn: () => serviceApi.getAvailableParts(serviceId, tagSearchQuery || undefined),
    enabled: activeTagForm !== null && !tagSelectedPart,
  });

  // Fetch available parts for extra spare section
  const { data: extraAvailableParts = [], isLoading: isLoadingExtraParts } = useQuery({
    queryKey: ['available-parts', serviceId, extraSearchQuery, 'extra'],
    queryFn: () => serviceApi.getAvailableParts(serviceId, extraSearchQuery || undefined),
    enabled: showExtraSpareForm && !extraSelectedPart,
  });

  // Add part mutation (updated to include isExtraSpare and faultTag)
  const addPartMutation = useMutation({
    mutationFn: (data: { branchInventoryId: string; quantity: number; unitPrice: number; isExtraSpare: boolean; faultTag?: string }) =>
      serviceApi.addServicePart(serviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      resetTagForm();
      resetExtraForm();
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

  const resetTagForm = () => {
    setActiveTagForm(null);
    setTagSelectedPart(null);
    setTagSearchQuery('');
    setTagQuantity(1);
    setShowTagDropdown(false);
  };

  const resetExtraForm = () => {
    setShowExtraSpareForm(false);
    setExtraSelectedPart(null);
    setExtraSearchQuery('');
    setExtraQuantity(1);
    setExtraUnitPrice(0);
    setShowExtraDropdown(false);
  };

  const handleAddTaggedPart = (tag: string) => {
    if (!tagSelectedPart) return;
    addPartMutation.mutate({
      branchInventoryId: tagSelectedPart.id,
      quantity: tagQuantity,
      unitPrice: Number(tagSelectedPart.item.salesPrice) || 0,
      isExtraSpare: false,
      faultTag: tag,
    });
  };

  const handleAddExtraSparePart = () => {
    if (!extraSelectedPart) return;
    addPartMutation.mutate({
      branchInventoryId: extraSelectedPart.id,
      quantity: extraQuantity,
      unitPrice: extraUnitPrice,
      isExtraSpare: true,
    });
  };

  // Approval method options
  const approvalMethods: { value: ApprovalMethod; label: string; icon: React.ReactNode }[] = [
    { value: 'PHONE_CALL', label: 'Phone Call', icon: <Phone className="h-4 w-4" /> },
    { value: 'WHATSAPP', label: 'WhatsApp', icon: <MessageCircle className="h-4 w-4" /> },
    { value: 'IN_PERSON', label: 'In Person', icon: <User className="h-4 w-4" /> },
    { value: 'SMS', label: 'SMS', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  const getApprovalMethodLabel = (method: string) => {
    const found = approvalMethods.find((m) => m.value === method);
    return found?.label || method;
  };

  const getPartName = (part: any) => {
    if (part.item?.itemName) return part.item.itemName;
    if (part.part?.name) return part.part.name;
    return 'Unknown Part';
  };

  const getPartCode = (part: any) => {
    if (part.item?.itemCode) return part.item.itemCode;
    if (part.part?.partNumber) return part.part.partNumber;
    return null;
  };

  // Calculate totals
  const taggedPartsTotal = taggedParts.reduce((sum, part) => sum + part.totalPrice, 0);
  const extraSpareTotal = extraSpareParts.reduce((sum, part) => sum + part.totalPrice, 0);
  const totalPartsValue = taggedPartsTotal + extraSpareTotal;

  // Helper to render part selection dropdown
  const renderPartDropdown = (
    parts: BranchInventoryPart[],
    isLoading: boolean,
    searchQuery: string,
    onSelect: (part: BranchInventoryPart) => void,
    onClose: () => void
  ) => (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {isLoading ? (
        <div className="p-4 text-center text-gray-500">Loading...</div>
      ) : parts.length > 0 ? (
        <>
          {!searchQuery && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
              Most Used Items
            </div>
          )}
          {parts.map((part) => (
            <button
              key={part.id}
              type="button"
              onClick={() => onSelect(part)}
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
      <div className="fixed inset-0 z-[-1]" onClick={onClose} />
    </div>
  );

  // Helper to render parts table
  const renderPartsTable = (partsList: any[], showApproval: boolean) => (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
          {showApproval && (
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Approval</th>
          )}
          {canEdit && (
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {partsList.map((part) => (
          <tr key={part.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">
              {getPartName(part)}
              {getPartCode(part) && (
                <span className="text-xs text-gray-500 block">{getPartCode(part)}</span>
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
                    onClick={() => updatePartMutation.mutate({ partId: part.id, data: { quantity: part.quantity - 1 } })}
                    disabled={part.quantity <= 1 || updatePartMutation.isPending}
                    className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{part.quantity}</span>
                  <button
                    onClick={() => updatePartMutation.mutate({ partId: part.id, data: { quantity: part.quantity + 1 } })}
                    disabled={updatePartMutation.isPending}
                    className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
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
            {showApproval && (
              <td className="px-4 py-3">
                {part.isApproved ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3" />
                      Approved
                    </span>
                    <span className="text-xs text-gray-500">{getApprovalMethodLabel(part.approvalMethod)}</span>
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
                            <option key={m.value} value={m.value}>{m.label}</option>
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
                          onClick={() => approvePartMutation.mutate({ partId: part.id, data: { approvalMethod, approvalNote: approvalNote || undefined } })}
                          disabled={approvePartMutation.isPending}
                          className="flex-1 px-2 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {approvePartMutation.isPending ? 'Approving...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => { setApprovingPartId(null); setApprovalNote(''); }}
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
            )}
            {canEdit && (
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  {editingPartId === part.id ? (
                    <>
                      <button
                        onClick={() => updatePartMutation.mutate({ partId: part.id, data: { quantity: editQuantity, unitPrice: editUnitPrice } })}
                        disabled={updatePartMutation.isPending}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingPartId(null)}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingPartId(part.id);
                          setEditQuantity(part.quantity);
                          setEditUnitPrice(part.unitPrice);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
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
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
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
  );

  return (
    <div className="space-y-6">
      {/* PARTS BASED ON FAULTS Section */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Parts Based on Faults</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Parts added based on fault tags (included in estimate price)</p>
        </div>

        {uniqueTags.length === 0 ? (
          <div className="p-6 text-center">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No fault tags defined</p>
            <p className="text-sm text-gray-400 mt-1">Add tags to faults in Master Data to enable tagged parts</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {uniqueTags.map((tag) => (
              <div key={tag} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 uppercase">
                      {tag}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({partsByTag[tag]?.length || 0} parts)
                    </span>
                  </div>
                  {canEdit && activeTagForm !== tag && (
                    <button
                      onClick={() => {
                        setActiveTagForm(tag);
                        setShowTagDropdown(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Part
                    </button>
                  )}
                </div>

                {/* Add Part Form for this tag */}
                {activeTagForm === tag && canEdit && (
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Add Part for "{tag}"</h4>
                      <button onClick={resetTagForm} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {!tagSelectedPart ? (
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search parts..."
                            value={tagSearchQuery}
                            onChange={(e) => setTagSearchQuery(e.target.value)}
                            onFocus={() => setShowTagDropdown(true)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        {showTagDropdown && renderPartDropdown(
                          tagAvailableParts,
                          isLoadingTagParts,
                          tagSearchQuery,
                          (part) => {
                            setTagSelectedPart(part);
                            setShowTagDropdown(false);
                          },
                          () => setShowTagDropdown(false)
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-purple-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{tagSelectedPart.item.itemName}</div>
                            <div className="text-sm text-gray-600">
                              Stock: {Number(tagSelectedPart.stockQuantity)} | Price: ₹{Number(tagSelectedPart.item.salesPrice) || 0}
                            </div>
                          </div>
                          <button onClick={() => setTagSelectedPart(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              max={Number(tagSelectedPart.stockQuantity)}
                              value={tagQuantity}
                              onChange={(e) => setTagQuantity(parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                          <button
                            onClick={() => handleAddTaggedPart(tag)}
                            disabled={addPartMutation.isPending || tagQuantity > Number(tagSelectedPart.stockQuantity)}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addPartMutation.isPending ? 'Adding...' : 'Add Part'}
                          </button>
                        </div>
                        {tagQuantity > Number(tagSelectedPart.stockQuantity) && (
                          <p className="text-xs text-red-600 mt-2">Insufficient stock!</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Parts list for this tag */}
                {partsByTag[tag]?.length > 0 ? (
                  <div className="overflow-x-auto">
                    {renderPartsTable(partsByTag[tag], false)}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    No parts added for this tag yet
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tagged Parts Total */}
        {taggedParts.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Tagged Parts Total:</span>
              <span className="text-lg font-bold text-purple-600">₹{taggedPartsTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* EXTRA SPARE PARTS Section */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Extra Spare Parts</h3>
                <p className="text-sm text-gray-600">Additional parts beyond fault requirements (charged separately)</p>
              </div>
            </div>
            {canEdit && !showExtraSpareForm && (
              <button
                onClick={() => {
                  setShowExtraSpareForm(true);
                  setShowExtraDropdown(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Extra Part
              </button>
            )}
          </div>
        </div>

        {/* Add Extra Spare Form */}
        {showExtraSpareForm && canEdit && (
          <div className="p-4 bg-orange-50 border-b border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Add Extra Spare Part</h4>
              <button onClick={resetExtraForm} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!extraSelectedPart ? (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search parts..."
                    value={extraSearchQuery}
                    onChange={(e) => setExtraSearchQuery(e.target.value)}
                    onFocus={() => setShowExtraDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                {showExtraDropdown && renderPartDropdown(
                  extraAvailableParts,
                  isLoadingExtraParts,
                  extraSearchQuery,
                  (part) => {
                    setExtraSelectedPart(part);
                    setExtraUnitPrice(Number(part.item.salesPrice) || 0);
                    setShowExtraDropdown(false);
                  },
                  () => setShowExtraDropdown(false)
                )}
              </div>
            ) : (
              <div className="p-4 bg-white border border-orange-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{extraSelectedPart.item.itemName}</div>
                    <div className="text-sm text-gray-600">Stock: {Number(extraSelectedPart.stockQuantity)}</div>
                  </div>
                  <button onClick={() => setExtraSelectedPart(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={Number(extraSelectedPart.stockQuantity)}
                      value={extraQuantity}
                      onChange={(e) => setExtraQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={extraUnitPrice}
                      onChange={(e) => setExtraUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between">
                  <span className="text-sm text-gray-600">Total Price:</span>
                  <span className="font-semibold text-gray-900">₹{(extraQuantity * extraUnitPrice).toFixed(2)}</span>
                </div>

                <button
                  onClick={handleAddExtraSparePart}
                  disabled={addPartMutation.isPending || extraQuantity > Number(extraSelectedPart.stockQuantity) || extraQuantity < 1}
                  className="w-full mt-4 bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addPartMutation.isPending ? 'Adding...' : 'Add Extra Spare Part'}
                </button>
                {extraQuantity > Number(extraSelectedPart.stockQuantity) && (
                  <p className="text-xs text-red-600 mt-2">Insufficient stock!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Extra Spare Parts List */}
        {extraSpareParts.length === 0 ? (
          <div className="p-6 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No extra spare parts added</p>
            {canEdit && (
              <p className="text-sm text-gray-400 mt-1">Click "Add Extra Part" to add parts beyond fault requirements</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {renderPartsTable(extraSpareParts, true)}
          </div>
        )}

        {/* Extra Spare Total */}
        {extraSpareParts.length > 0 && (
          <div className="px-6 py-3 bg-orange-50 border-t border-orange-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Extra Spare Total:</span>
              <span className="text-lg font-bold text-orange-600">₹{extraSpareTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Grand Total */}
      {(taggedParts.length > 0 || extraSpareParts.length > 0) && (
        <div className="bg-gray-900 text-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Parts Value:</span>
            <span className="text-2xl font-bold">₹{totalPartsValue.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(addPartMutation.isError || updatePartMutation.isError || approvePartMutation.isError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
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
