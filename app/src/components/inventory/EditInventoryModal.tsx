import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { inventoryApi } from '../../services/inventoryApi';
import { supplierApi } from '../../services/supplierApi';
import { masterDataApi } from '../../services/masterDataApi';
import {
  InventoryFormData,
  InventoryCategory,
  Unit,
  GSTRate,
  TaxType,
} from '../../types';
import {
  TAX_TYPES,
  calculateGST,
  formatCurrency,
  validateHSNCode,
} from '../../constants/inventory';
import { useAuthStore } from '../../store/authStore';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryId: string;
  onSuccess?: () => void;
}

const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  isOpen,
  onClose,
  inventoryId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { activeBranch } = useAuthStore();

  const [formData, setFormData] = useState<Partial<InventoryFormData>>({
    category: InventoryCategory.OTHER,
    unit: Unit.PIECE,
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    purchasePrice: undefined,
    salesPrice: undefined,
    minStockLevel: 1,
    maxStockLevel: 100,
    reorderLevel: 5,
    active: true,
  });

  const [billFile, setBillFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [gstCalculation, setGstCalculation] = useState({
    gstPercentage: 0,
    gstAmount: 0,
    totalWithGST: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
  });

  // Fetch inventory data
  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory', inventoryId],
    queryFn: () => inventoryApi.getInventoryById(inventoryId),
    enabled: isOpen && !!inventoryId,
  });

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-dropdown', activeBranch?.id],
    queryFn: () => supplierApi.getSuppliersDropdown(activeBranch?.id),
  });

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

  // Pre-populate form when inventory data is loaded
  useEffect(() => {
    if (inventory) {
      setFormData({
        partName: inventory.partName,
        description: inventory.description || '',
        modelNumber: inventory.modelNumber || '',
        brandName: inventory.brandName || '',
        category: inventory.category,
        unit: inventory.unit,
        hsnCode: inventory.hsnCode,
        gstRate: inventory.gstRate,
        taxType: inventory.taxType,
        purchasePrice: inventory.purchasePrice,
        salesPrice: inventory.salesPrice,
        minStockLevel: inventory.minStockLevel || 1,
        maxStockLevel: inventory.maxStockLevel || 100,
        reorderLevel: inventory.reorderLevel || 5,
        supplierId: inventory.supplierId || '',
        purchaseDate: inventory.purchaseDate
          ? new Date(inventory.purchaseDate).toISOString().split('T')[0]
          : '',
        billNumber: inventory.billNumber || '',
        notes: inventory.notes || '',
        active: inventory.active,
      });

      // Calculate GST for pre-filled data
      if (inventory.purchasePrice && inventory.gstRate) {
        const gst = calculateGST(inventory.purchasePrice, inventory.gstRate);
        setGstCalculation(gst);
      }
    }
  }, [inventory]);

  // Recalculate GST when relevant fields change
  useEffect(() => {
    if (formData.purchasePrice && formData.gstRate) {
      const gst = calculateGST(formData.purchasePrice, formData.gstRate);
      setGstCalculation(gst);
    }
  }, [formData.purchasePrice, formData.gstRate]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InventoryFormData>) =>
      inventoryApi.updateInventory(inventoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', inventoryId] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      setError(
        error.response?.data?.message || 'Failed to update inventory item'
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.partName?.trim()) {
      setError('Part name is required');
      return;
    }

    if (!formData.hsnCode?.trim()) {
      setError('HSN code is required for GST compliance');
      return;
    }

    if (formData.hsnCode && !validateHSNCode(formData.hsnCode)) {
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

    // Prepare data for submission
    const submitData: Partial<InventoryFormData> = {
      partName: formData.partName,
      description: formData.description,
      modelNumber: formData.modelNumber,
      brandName: formData.brandName,
      category: formData.category,
      unit: formData.unit,
      hsnCode: formData.hsnCode,
      gstRate: formData.gstRate,
      taxType: formData.taxType,
      purchasePrice: formData.purchasePrice,
      salesPrice: formData.salesPrice,
      minStockLevel: formData.minStockLevel,
      maxStockLevel: formData.maxStockLevel,
      reorderLevel: formData.reorderLevel,
      supplierId: formData.supplierId || undefined,
      purchaseDate: formData.purchaseDate || undefined,
      billNumber: formData.billNumber,
      billAttachment: billFile || undefined,
      notes: formData.notes,
      active: formData.active,
    };

    updateMutation.mutate(submitData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBillFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Edit Inventory Item
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Loading State */}
        {isLoadingInventory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading inventory data...</span>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Part Number (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Number
                    </label>
                    <input
                      type="text"
                      value={inventory?.partNumber || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  {/* Part Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="partName"
                      value={formData.partName || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {categoriesData?.data.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      name="brandName"
                      value={formData.brandName || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Model Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model Number
                    </label>
                    <input
                      type="text"
                      name="modelNumber"
                      value={formData.modelNumber || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="unitId"
                      value={formData.unitId || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & GST Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Pricing & GST (Optional - can be set via Purchase Orders)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* HSN Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HSN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="hsnCode"
                      value={formData.hsnCode || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., 85177900"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      6 or 8 digit HSN code
                    </p>
                  </div>

                  {/* GST Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Rate <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gstRateId"
                      value={formData.gstRateId || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                  {/* Tax Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="taxType"
                      value={formData.taxType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {TAX_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price (₹)
                    </label>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice ?? ''}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Leave empty to set via Purchase Order"
                    />
                  </div>

                  {/* Sales Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sales Price (₹)
                    </label>
                    <input
                      type="number"
                      name="salesPrice"
                      value={formData.salesPrice ?? ''}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Leave empty to set via Purchase Order"
                    />
                  </div>

                  {/* GST Calculation Display */}
                  <div className="md:col-span-2 bg-white p-3 rounded border border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      GST Calculation (on Purchase Price)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Base Price:</span>
                        <p className="font-semibold">
                          {formatCurrency(formData.purchasePrice || 0)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          GST ({gstCalculation.gstPercentage}%):
                        </span>
                        <p className="font-semibold">
                          {formatCurrency(gstCalculation.gstAmount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Total with GST:</span>
                        <p className="font-semibold text-blue-600">
                          {formatCurrency(gstCalculation.totalWithGST)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Profit Margin:</span>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(
                            (formData.salesPrice || 0) -
                              (formData.purchasePrice || 0)
                          )}
                        </p>
                      </div>
                    </div>
                    {formData.taxType === TaxType.CGST_SGST && (
                      <div className="mt-2 text-xs text-gray-600">
                        CGST: {formatCurrency(gstCalculation.cgst || 0)} | SGST:{' '}
                        {formatCurrency(gstCalculation.sgst || 0)}
                      </div>
                    )}
                    {formData.taxType === TaxType.IGST && (
                      <div className="mt-2 text-xs text-gray-600">
                        IGST: {formatCurrency(gstCalculation.igst || 0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Information Section */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Stock Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Current Stock (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock Quantity
                    </label>
                    <input
                      type="text"
                      value={`${inventory?.stockQuantity || 0} ${
                        formData.unit || 'units'
                      }`}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use 'Adjust Stock' to change quantity
                    </p>
                  </div>

                  {/* Min Stock Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Stock Level
                    </label>
                    <input
                      type="number"
                      name="minStockLevel"
                      value={formData.minStockLevel || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Max Stock Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Stock Level
                    </label>
                    <input
                      type="number"
                      name="maxStockLevel"
                      value={formData.maxStockLevel || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Reorder Level */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      name="reorderLevel"
                      value={formData.reorderLevel || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Alert when stock reaches this level
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplier Information Section */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Supplier & Purchase Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Supplier */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier
                    </label>
                    <select
                      name="supplierId"
                      value={formData.supplierId || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Supplier (Optional)</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} ({supplier.supplierCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={formData.purchaseDate || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Bill Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bill/Invoice Number
                    </label>
                    <input
                      type="text"
                      name="billNumber"
                      value={formData.billNumber || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Bill Attachment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bill/Invoice Attachment
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {inventory?.billAttachmentUrl && !billFile && (
                      <p className="text-xs text-gray-600 mt-1">
                        Current file:{' '}
                        <a
                          href={inventory.billAttachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View attachment
                        </a>
                      </p>
                    )}
                    {billFile && (
                      <p className="text-xs text-green-600 mt-1">
                        New file selected: {billFile.name}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active || false}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Inventory'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EditInventoryModal;
