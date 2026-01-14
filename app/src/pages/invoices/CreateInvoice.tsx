import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '@/services/invoiceApi';
import { invoiceTemplateApi } from '@/services/invoiceTemplateApi';
import { masterDataApi } from '@/services/masterDataApi';
import { themeApi } from '@/services/themeApi';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, ArrowLeft, FileText, Save, FileCheck, Palette, Wrench, Package } from 'lucide-react';
import SearchableCustomerSelect from '@/components/common/SearchableCustomerSelect';
import SearchableBranchInventorySelect from '@/components/common/SearchableBranchInventorySelect';
import { toast } from 'sonner';

// Item type determined by presence of itemId (itemId exists = Inventory, otherwise = Service)
type ItemMode = 'SERVICE' | 'INVENTORY';

interface InvoiceItem {
  // UI mode for toggle (not sent to backend)
  mode: ItemMode;
  // Common fields
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  // Inventory fields (null/undefined for Service items)
  branchInventoryId?: string;
  itemId?: string;        // If exists = Inventory item
  itemCode?: string;
  itemName?: string;
  stockQuantity?: number;
  hsnCode?: string;
  gstRate?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const createEmptyServiceItem = (): InvoiceItem => ({
  mode: 'SERVICE',
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
});

const createEmptyInventoryItem = (): InvoiceItem => ({
  mode: 'INVENTORY',
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
});

export default function CreateInvoice() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    customerId: '',
    paidAmount: 0,
    paymentMethodId: '',
    notes: '',
    taxRate: 18,
    themeId: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([createEmptyServiceItem()]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Fetch active templates
  const { data: templatesData } = useQuery({
    queryKey: ['invoice-templates-active'],
    queryFn: () => invoiceTemplateApi.getAll({ isActive: true, limit: 100 }),
  });

  // Fetch payment methods
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => masterDataApi.getAllPaymentMethods({ isActive: true, limit: 100 }),
  });

  // Fetch active themes
  const { data: themesData } = useQuery({
    queryKey: ['themes-active'],
    queryFn: () => themeApi.getAll({ isActive: true, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: invoiceApi.create,
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
      navigate(`/invoices/${invoice.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const handleAddItem = (mode: ItemMode) => {
    if (mode === 'SERVICE') {
      setItems([...items, createEmptyServiceItem()]);
    } else {
      setItems([...items, createEmptyInventoryItem()]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      toast.error('At least one item is required');
    }
  };

  const handleItemModeChange = (index: number, newMode: ItemMode) => {
    const newItems = [...items];
    if (newMode === 'SERVICE') {
      newItems[index] = {
        ...createEmptyServiceItem(),
        quantity: newItems[index].quantity,
      };
    } else {
      newItems[index] = {
        ...createEmptyInventoryItem(),
        quantity: newItems[index].quantity,
      };
    }
    setItems(newItems);
  };

  const handleServiceItemChange = (
    index: number,
    field: 'description' | 'quantity' | 'unitPrice',
    value: string | number
  ) => {
    const newItems = [...items];

    if (field === 'description') {
      newItems[index].description = value as string;
    } else {
      const numValue = Number(value) || 0;
      newItems[index][field] = numValue;
      const qty = Number(newItems[index].quantity) || 0;
      const price = Number(newItems[index].unitPrice) || 0;
      newItems[index].amount = qty * price;
    }

    setItems(newItems);
  };

  const handleInventoryItemSelect = (
    index: number,
    branchInventoryId: string,
    inventoryItem?: any
  ) => {
    const newItems = [...items];

    if (inventoryItem) {
      // Check for duplicate - find if this item already exists in another row
      const existingIndex = newItems.findIndex(
        (item, i) => i !== index && item.itemId === inventoryItem.item.id
      );

      if (existingIndex !== -1) {
        // Duplicate found - increment quantity in existing row
        const existingItem = newItems[existingIndex];
        const currentQty = Number(existingItem.quantity) || 0;
        const newQuantity = currentQty + 1;
        const stockQty = Number(existingItem.stockQuantity) || 0;

        // Check stock availability
        if (stockQty > 0 && newQuantity > stockQty) {
          toast.error(`Only ${stockQty} units available in stock`);
          return;
        }

        // Update existing row quantity
        const unitPrice = Number(newItems[existingIndex].unitPrice) || 0;
        newItems[existingIndex].quantity = newQuantity;
        newItems[existingIndex].amount = newQuantity * unitPrice;

        // Reset current row to empty
        newItems[index] = createEmptyInventoryItem();

        setItems(newItems);
        toast.info(`Quantity updated in Item ${existingIndex + 1}`);
      } else {
        // No duplicate - normal behavior
        const salesPrice = Number(inventoryItem.item.salesPrice) || 0;
        const stockQty = Number(inventoryItem.stockQuantity) || 0;
        const gstRate = Number(inventoryItem.item.itemGSTRate?.rate) || 0;

        newItems[index] = {
          mode: 'INVENTORY',
          branchInventoryId: inventoryItem.id,
          itemId: inventoryItem.item.id,
          itemCode: inventoryItem.item.itemCode,
          itemName: inventoryItem.item.itemName,
          description: inventoryItem.item.itemName,
          stockQuantity: stockQty,
          hsnCode: inventoryItem.item.hsnCode,
          gstRate: gstRate,
          quantity: 1,
          unitPrice: salesPrice,
          amount: salesPrice,
        };
        setItems(newItems);
      }
    } else {
      newItems[index] = createEmptyInventoryItem();
      setItems(newItems);
    }
  };

  const handleInventoryQuantityChange = (index: number, value: number) => {
    const newItems = [...items];
    const item = newItems[index];
    const numValue = Number(value) || 0;
    const stockQty = Number(item.stockQuantity) || 0;

    if (stockQty > 0 && numValue > stockQty) {
      toast.error(`Only ${stockQty} units available in stock`);
      return;
    }

    const unitPrice = Number(newItems[index].unitPrice) || 0;
    newItems[index].quantity = numValue;
    newItems[index].amount = numValue * unitPrice;
    setItems(newItems);
  };

  const handleInventoryPriceChange = (index: number, value: number) => {
    const newItems = [...items];
    const numValue = Number(value) || 0;
    const qty = Number(newItems[index].quantity) || 0;
    newItems[index].unitPrice = numValue;
    newItems[index].amount = qty * numValue;
    setItems(newItems);
  };

  const handleLoadTemplate = async (templateId: string) => {
    if (!templateId) {
      setSelectedTemplateId('');
      return;
    }

    try {
      const template = await invoiceTemplateApi.getById(templateId);
      setSelectedTemplateId(templateId);

      setFormData((prev) => ({
        ...prev,
        taxRate: template.taxRate,
        notes: template.notes || prev.notes,
      }));

      // Template items are service items
      setItems(
        template.items.map((item) => {
          const qty = Number(item.quantity) || 0;
          const price = Number(item.unitPrice) || 0;
          return {
            mode: 'SERVICE' as ItemMode,
            description: item.description,
            quantity: qty,
            unitPrice: price,
            amount: qty * price,
          };
        })
      );

      toast.success('Template loaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load template');
      setSelectedTemplateId('');
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const taxRate = Number(formData.taxRate) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    const paidAmount = Number(formData.paidAmount) || 0;
    const balanceAmount = totalAmount - paidAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount,
      balanceAmount,
    };
  };

  const totals = calculateTotals();

  const validateItems = (): boolean => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.mode === 'SERVICE') {
        if (!item.description.trim()) {
          toast.error(`Item ${i + 1}: Please enter a description`);
          return false;
        }
      } else {
        // Inventory mode - must have itemId (selected from dropdown)
        if (!item.itemId) {
          toast.error(`Item ${i + 1}: Please select an inventory item`);
          return false;
        }
        if (item.stockQuantity && item.quantity > item.stockQuantity) {
          toast.error(`Item ${i + 1}: Quantity exceeds available stock (${item.stockQuantity})`);
          return false;
        }
      }

      if (item.quantity <= 0) {
        toast.error(`Item ${i + 1}: Quantity must be greater than 0`);
        return false;
      }

      if (item.unitPrice < 0) {
        toast.error(`Item ${i + 1}: Unit price cannot be negative`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.activeBranch?.id) {
      toast.error('Please select a branch first');
      return;
    }

    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (!validateItems()) {
      return;
    }

    if (formData.paidAmount > 0 && !formData.paymentMethodId) {
      toast.error('Please select a payment method for the paid amount');
      return;
    }

    const invoiceData = {
      customerId: formData.customerId,
      branchId: user.activeBranch.id,
      items: items.map((item) => {
        // Ensure all numeric values are numbers
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        const amt = Number(item.amount) || 0;

        const baseItem = {
          description: item.itemId ? (item.itemName || item.description) : item.description,
          quantity: qty,
          unitPrice: price,
          amount: amt,
        };

        // Add inventory fields only if itemId exists
        if (item.itemId) {
          return {
            ...baseItem,
            itemId: item.itemId,
            itemCode: item.itemCode || undefined,
            branchInventoryId: item.branchInventoryId || undefined,
            hsnCode: item.hsnCode || undefined,
            gstRate: Number(item.gstRate) || undefined,
          };
        }

        return baseItem;
      }),
      totalAmount: Number(totals.totalAmount) || 0,
      paidAmount: Number(formData.paidAmount) || 0,
      paymentMethodId: formData.paymentMethodId || undefined,
      notes: formData.notes || undefined,
      themeId: formData.themeId || undefined,
    };

    createMutation.mutate(invoiceData);
  };

  // Get used branchInventoryIds to exclude from dropdown
  const usedBranchInventoryIds = items
    .filter((item) => item.branchInventoryId)
    .map((item) => item.branchInventoryId as string);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7" />
              Create Invoice
            </h1>
            <p className="text-sm text-gray-500 mt-1">Create a new standalone invoice</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <SearchableCustomerSelect
                value={formData.customerId}
                onChange={(customerId) => setFormData({ ...formData, customerId })}
                required
                placeholder="Search and select customer..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Load from Template (Optional)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleLoadTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Start from scratch</option>
                {templatesData?.templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.items.length} items)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Select a template to auto-fill invoice items</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                PDF Theme (Optional)
              </label>
              <select
                value={formData.themeId}
                onChange={(e) => setFormData({ ...formData, themeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Use default theme</option>
                {themesData?.data?.map((theme: any) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name} {theme.isDefault && '⭐'}
                  </option>
                )) || null}
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose colors and style for the PDF invoice</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Add any additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Items <span className="text-red-500">*</span>
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAddItem('SERVICE')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Wrench className="w-4 h-4" />
                Add Service
              </button>
              <button
                type="button"
                onClick={() => handleAddItem('INVENTORY')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Package className="w-4 h-4" />
                Add Inventory
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  item.mode === 'SERVICE'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                {/* Item Type Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Item {index + 1}:</span>
                    <div className="flex rounded-lg overflow-hidden border border-gray-300">
                      <button
                        type="button"
                        onClick={() => handleItemModeChange(index, 'SERVICE')}
                        className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                          item.mode === 'SERVICE'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Service
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemModeChange(index, 'INVENTORY')}
                        className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                          item.mode === 'INVENTORY'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        Inventory
                      </button>
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Service Item Fields */}
                {item.mode === 'SERVICE' && (
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleServiceItemChange(index, 'description', e.target.value)}
                        placeholder="e.g., Screen Replacement, Battery Service"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qty <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleServiceItemChange(index, 'quantity', e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleServiceItemChange(index, 'unitPrice', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Inventory Item Fields */}
                {item.mode === 'INVENTORY' && (
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Item <span className="text-red-500">*</span>
                      </label>
                      <SearchableBranchInventorySelect
                        value={item.branchInventoryId || ''}
                        onChange={(id, inv) => handleInventoryItemSelect(index, id, inv)}
                        placeholder="Search inventory items..."
                        excludeIds={usedBranchInventoryIds.filter((id) => id !== item.branchInventoryId)}
                      />
                      {item.stockQuantity !== undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available Stock: <span className="font-semibold">{item.stockQuantity}</span>
                          {item.hsnCode && <span className="ml-2">| HSN: {item.hsnCode}</span>}
                          {item.gstRate !== undefined && <span className="ml-2">| GST: {item.gstRate}%</span>}
                        </p>
                      )}
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qty <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleInventoryQuantityChange(index, Number(e.target.value))}
                        min="1"
                        max={item.stockQuantity || undefined}
                        step="1"
                        required
                        disabled={!item.branchInventoryId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleInventoryPriceChange(index, Number(e.target.value))}
                        min="0"
                        step="0.01"
                        required
                        disabled={!item.branchInventoryId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
              <input
                type="number"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                min="0"
                max={totals.totalAmount}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave as 0 if no payment received yet</p>
            </div>

            {formData.paidAmount > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paymentMethodId}
                  onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                  required={formData.paidAmount > 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Payment Method</option>
                  {paymentMethodsData?.data?.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (GST {formData.taxRate}%):</span>
              <span className="font-medium text-gray-900">{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-3">
              <span>Total Amount:</span>
              <span className="text-purple-600">{formatCurrency(totals.totalAmount)}</span>
            </div>
            {formData.paidAmount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-medium text-green-600">{formatCurrency(formData.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-orange-600">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(totals.balanceAmount)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
