import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/services/inventoryApi';
import { masterDataApi } from '@/services/masterDataApi';
import { InventoryFormData, Unit, GSTRate, TaxType } from '@/types';
import { X, Package, Loader2, Upload } from 'lucide-react';
import {
  TAX_TYPES,
  validateHSNCode,
  calculateGST,
  formatCurrency,
} from '@/constants/inventory';
import { useAuthStore } from '@/store/authStore';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Array<{ id: string; name: string; supplierCode: string; phone: string }>;
}

export default function AddInventoryModal({
  isOpen,
  onClose,
  suppliers,
}: AddInventoryModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const activeBranchId = user?.activeBranch?.id || user?.branchId || '';

  const [error, setError] = useState('');
  const [billFile, setBillFile] = useState<File | null>(null);

  // Fetch master data from API
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => masterDataApi.categories.getAll({ limit: 100, isActive: true }),
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => masterDataApi.units.getAll({ limit: 100, isActive: true }),
  });

  const { data: gstRatesData } = useQuery({
    queryKey: ['gstRates'],
    queryFn: () => masterDataApi.gstRates.getAll({ limit: 100, isActive: true }),
  });

  const [formData, setFormData] = useState<InventoryFormData>({
    partName: '',
    description: '',
    modelVariant: '',
    brandName: '',
    unit: Unit.PIECE,
    purchasePrice: undefined,
    salesPrice: undefined,
    hsnCode: '',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    stockQuantity: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    reorderLevel: 0,
    branchId: activeBranchId,
  });

  const createMutation = useMutation({
    mutationFn: inventoryApi.createInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      alert('Inventory item created successfully');
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create inventory item');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.partName.trim()) {
      setError('Part name is required');
      return;
    }

    if (!validateHSNCode(formData.hsnCode)) {
      setError('HSN code must be 6 or 8 digits');
      return;
    }

    // Prices are optional - can be set through purchase orders
    if (formData.purchasePrice !== undefined && formData.purchasePrice < 0) {
      setError('Purchase price cannot be negative');
      return;
    }

    if (formData.salesPrice !== undefined && formData.salesPrice < 0) {
      setError('Sales price cannot be negative');
      return;
    }

    const dataToSubmit: InventoryFormData = {
      ...formData,
      billAttachment: billFile || undefined,
    };

    createMutation.mutate(dataToSubmit);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBillFile(e.target.files[0]);
    }
  };

  // Calculate GST for display
  const gstCalc = calculateGST(formData.salesPrice, formData.gstRate);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Inventory Item</h2>
              <p className="text-sm text-gray-600">Create new inventory item with GST details</p>
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

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.partName}
                  onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part Number (Auto-generated if empty)
                </label>
                <input
                  type="text"
                  value={formData.partNumber || ''}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty for auto-generation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                <input
                  type="text"
                  value={formData.brandName || ''}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model/Variant</label>
                <input
                  type="text"
                  value={formData.modelVariant || ''}
                  onChange={(e) => setFormData({ ...formData, modelVariant: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
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
                />
              </div>
            </div>
          </div>

          {/* Pricing & GST */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & GST (Optional - can be set via Purchase Orders)</h3>
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
                  placeholder="Leave empty to set via Purchase Order"
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
                  placeholder="Leave empty to set via Purchase Order"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HSN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                  placeholder="6 or 8 digits"
                  maxLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Rate <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gstRateId}
                  onChange={(e) => setFormData({ ...formData, gstRateId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  Tax Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  {TAX_TYPES.map((tax) => (
                    <label key={tax.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="taxType"
                        value={tax.value}
                        checked={formData.taxType === tax.value}
                        onChange={(e) => setFormData({ ...formData, taxType: e.target.value as TaxType })}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{tax.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* GST Calculation Display */}
              {formData.salesPrice && formData.salesPrice > 0 && (
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">GST Calculation</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-blue-600">Base Price</div>
                      <div className="font-semibold text-blue-900">{formatCurrency(formData.salesPrice)}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">GST ({gstCalc.gstPercentage}%)</div>
                      <div className="font-semibold text-blue-900">{formatCurrency(gstCalc.gstAmount)}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Total with GST</div>
                      <div className="font-semibold text-blue-900">{formatCurrency(gstCalc.totalWithGST)}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Margin</div>
                      <div className="font-semibold text-blue-900">
                        {formatCurrency((formData.salesPrice || 0) - (formData.purchasePrice || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Stock</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock Level</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Stock Level</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxStockLevel}
                  onChange={(e) => setFormData({ ...formData, maxStockLevel: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <select
                  value={formData.supplierId || ''}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Invoice Number</label>
                <input
                  type="text"
                  value={formData.supplierInvoiceNumber || ''}
                  onChange={(e) => setFormData({ ...formData, supplierInvoiceNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchaseDate || ''}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill/Invoice Attachment
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {billFile ? billFile.name : 'Choose file'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
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
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Package className="h-5 w-5" />
                  Create Inventory Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
