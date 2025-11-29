import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '@/services/itemsApi';
import { categoryApi, unitApi, gstRateApi, brandApi, modelApi } from '@/services/masterDataApi';
import { X, Package, Loader2, Edit2 } from 'lucide-react';
import { Item } from '@/types';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
}

interface ItemFormData {
  itemName: string;
  barcode?: string;
  description?: string;
  modelVariant?: string;
  brandId?: string;
  modelId?: string;
  categoryId?: string;
  unitId?: string;
  purchasePrice?: number;
  salesPrice?: number;
  hsnCode?: string;
  gstRateId?: string;
  taxType?: 'CGST_SGST' | 'IGST';
}

const formatCurrency = (value?: number) => {
  if (!value) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(value);
};

const validateHSNCode = (code: string) => {
  const cleaned = code.replace(/\s/g, '');
  return /^\d{6}$|^\d{8}$/.test(cleaned);
};

export default function EditItemModal({
  isOpen,
  onClose,
  item,
}: EditItemModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ItemFormData>({
    itemName: '',
    barcode: '',
    description: '',
    modelVariant: '',
    purchasePrice: undefined,
    salesPrice: undefined,
    hsnCode: '',
    taxType: 'CGST_SGST',
  });

  // Initialize form data with item values
  useEffect(() => {
    if (item) {
      setFormData({
        itemName: item.itemName,
        barcode: item.barcode || '',
        description: item.description || '',
        modelVariant: item.modelVariant || '',
        brandId: item.brandId || undefined,
        modelId: item.modelId || undefined,
        categoryId: item.categoryId || undefined,
        unitId: item.unitId || undefined,
        purchasePrice: item.purchasePrice || undefined,
        salesPrice: item.salesPrice || undefined,
        hsnCode: item.hsnCode || '',
        gstRateId: item.gstRateId || undefined,
        taxType: item.taxType || 'CGST_SGST',
      });
    }
  }, [item]);

  // Fetch master data from API
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-dropdown'],
    queryFn: () => categoryApi.getAll({ limit: 100, isActive: true }),
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units-dropdown'],
    queryFn: () => unitApi.getAll({ limit: 100, isActive: true }),
  });

  const { data: gstRatesData } = useQuery({
    queryKey: ['gst-rates-dropdown'],
    queryFn: () => gstRateApi.getAll({ limit: 100, isActive: true }),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands-dropdown'],
    queryFn: () => brandApi.getAll({ limit: 100, isActive: true }),
  });

  const { data: modelsData } = useQuery({
    queryKey: ['models-dropdown', formData.brandId],
    queryFn: () => modelApi.getAll({
      limit: 100,
      isActive: true,
      brandId: formData.brandId
    }),
    enabled: !!formData.brandId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: ItemFormData) => itemsApi.updateItem(item.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      alert('Item updated successfully');
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update item');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.itemName.trim()) {
      setError('Item name is required');
      return;
    }

    if (formData.hsnCode && !validateHSNCode(formData.hsnCode)) {
      setError('HSN code must be 6 or 8 digits');
      return;
    }

    if (formData.purchasePrice !== undefined && formData.purchasePrice < 0) {
      setError('Purchase price cannot be negative');
      return;
    }

    if (formData.salesPrice !== undefined && formData.salesPrice < 0) {
      setError('Sales price cannot be negative');
      return;
    }

    updateMutation.mutate(formData);
  };

  // Calculate GST for display
  const gstRate = gstRatesData?.data.find(r => r.id === formData.gstRateId);
  const gstPercentage = gstRate?.rate || 0;
  const gstAmount = formData.salesPrice ? (formData.salesPrice * gstPercentage) / 100 : 0;
  const totalWithGST = (formData.salesPrice || 0) + gstAmount;
  const margin = (formData.salesPrice || 0) - (formData.purchasePrice || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Edit2 className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Item</h2>
              <p className="text-sm text-gray-600">Update item in the company catalog</p>
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

          {/* Item Code Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Item Code</div>
            <div className="font-semibold text-gray-900">{item.itemCode}</div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.barcode || ''}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Scan or enter barcode"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categoriesData?.data.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <select
                  value={formData.brandId || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    brandId: e.target.value || undefined,
                    modelId: undefined, // Reset model when brand changes
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Brand</option>
                  {brandsData?.data.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select
                  value={formData.modelId || ''}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value || undefined })}
                  disabled={!formData.brandId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Model</option>
                  {modelsData?.data.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model/Variant</label>
                <input
                  type="text"
                  value={formData.modelVariant || ''}
                  onChange={(e) => setFormData({ ...formData, modelVariant: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 128GB, Black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unitId || ''}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Unit</option>
                  {unitsData?.data.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code}) {unit.symbol && `- ${unit.symbol}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional details about this item"
                />
              </div>
            </div>
          </div>

          {/* Pricing & GST */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & GST</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchasePrice ?? ''}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Base purchase price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salesPrice ?? ''}
                  onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Base selling price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HSN Code
                </label>
                <input
                  type="text"
                  value={formData.hsnCode || ''}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                  placeholder="6 or 8 digits"
                  maxLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Rate
                </label>
                <select
                  value={formData.gstRateId || ''}
                  onChange={(e) => setFormData({ ...formData, gstRateId: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select GST Rate</option>
                  {gstRatesData?.data.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.name} - {rate.rate}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="taxType"
                      value="CGST_SGST"
                      checked={formData.taxType === 'CGST_SGST'}
                      onChange={(e) => setFormData({ ...formData, taxType: e.target.value as any })}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">CGST + SGST (Intra-state)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="taxType"
                      value="IGST"
                      checked={formData.taxType === 'IGST'}
                      onChange={(e) => setFormData({ ...formData, taxType: e.target.value as any })}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">IGST (Inter-state)</span>
                  </label>
                </div>
              </div>

              {/* GST Calculation Display */}
              {formData.salesPrice && formData.salesPrice > 0 && gstRate && (
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">GST Calculation Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-blue-600">Base Price</div>
                      <div className="font-semibold text-blue-900">{formatCurrency(formData.salesPrice)}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">GST ({gstPercentage}%)</div>
                      <div className="font-semibold text-blue-900">{formatCurrency(gstAmount)}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Total with GST</div>
                      <div className="font-semibold text-blue-900">{formatCurrency(totalWithGST)}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Margin</div>
                      <div className={`font-semibold ${margin >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        {formatCurrency(margin)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              className="flex items-center gap-2 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit2 className="h-5 w-5" />
                  Update Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
