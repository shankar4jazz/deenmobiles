import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { purchaseOrderApi } from '@/services/purchaseOrderApi';
import { supplierApi } from '@/services/supplierApi';
import { itemsApi } from '@/services/itemsApi';
import { masterDataApi } from '@/services/masterDataApi';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { PurchaseOrderFormData } from '@/types';

interface POItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  salesPrice?: number;
  taxRate: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function CreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    invoiceNumber: '',
    invoiceDate: '',
    notes: '',
  });

  const [items, setItems] = useState<POItem[]>([
    { itemId: '', quantity: 1, unitPrice: 0, salesPrice: 0, taxRate: 0 },
  ]);

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-dropdown', user?.activeBranch?.id],
    queryFn: () => supplierApi.getSuppliersDropdown(user?.activeBranch?.id),
  });

  // Fetch items from catalog
  const { data: itemsData } = useQuery({
    queryKey: ['items-dropdown'],
    queryFn: () => itemsApi.getItemsDropdown(),
  });

  // Fetch GST rates from master data
  const { data: gstRatesData } = useQuery({
    queryKey: ['gstRates'],
    queryFn: () => masterDataApi.gstRates.getAll({ limit: 100, isActive: true }),
  });

  const createMutation = useMutation({
    mutationFn: purchaseOrderApi.createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      navigate('/purchases');
    },
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      { itemId: '', quantity: 1, unitPrice: 0, salesPrice: 0, taxRate: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof POItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'itemId' ? value : Number(value),
    };

    // Auto-populate prices and tax rate from item
    if (field === 'itemId' && value) {
      const item = itemsData?.find((i) => i.id === value);
      if (item) {
        // Set purchase price if available, otherwise leave as 0 for manual entry
        newItems[index].unitPrice = item.purchasePrice || 0;

        // Set sales price if available, otherwise leave as 0 for manual entry
        newItems[index].salesPrice = item.salesPrice || 0;

        // Get GST rate from item's GST rate relation
        if (item.itemGSTRate) {
          newItems[index].taxRate = item.itemGSTRate.rate;
        }
      }
    }

    setItems(newItems);
  };

  const calculateItemTotal = (item: POItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = (subtotal * item.taxRate) / 100;
    return subtotal + taxAmount;
  };

  const calculateTotals = () => {
    let totalAmount = 0;
    let taxAmount = 0;

    items.forEach((item) => {
      const subtotal = item.quantity * item.unitPrice;
      const itemTax = (subtotal * item.taxRate) / 100;
      totalAmount += subtotal;
      taxAmount += itemTax;
    });

    return {
      totalAmount,
      taxAmount,
      grandTotal: totalAmount + taxAmount,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.activeBranch?.id) {
      alert('Please select a branch first');
      return;
    }

    if (!formData.supplierId) {
      alert('Please select a supplier');
      return;
    }

    if (items.some((item) => !item.itemId || item.quantity <= 0 || item.unitPrice <= 0)) {
      alert('Please fill in all item details correctly');
      return;
    }

    const poData: PurchaseOrderFormData = {
      supplierId: formData.supplierId,
      branchId: user.activeBranch.id,
      orderDate: formData.orderDate || undefined,
      expectedDelivery: formData.expectedDelivery || undefined,
      invoiceNumber: formData.invoiceNumber || undefined,
      invoiceDate: formData.invoiceDate || undefined,
      notes: formData.notes || undefined,
      items: items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        salesPrice: item.salesPrice,
        taxRate: item.taxRate,
      })),
    };

    createMutation.mutate(poData);
  };

  const getItemName = (itemId: string) => {
    const item = itemsData?.find((i) => i.id === itemId);
    return item
      ? `${item.itemName} ${item.modelVariant ? `- ${item.modelVariant}` : ''}`
      : '';
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/purchases')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create Purchase Order
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Fill in the details to create a new purchase order
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Order Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) =>
                    setFormData({ ...formData, supplierId: e.target.value })
                  }
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">Select Supplier</option>
                  {suppliers?.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Order Date
                </label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) =>
                    setFormData({ ...formData, orderDate: e.target.value })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Delivery
                </label>
                <input
                  type="date"
                  value={formData.expectedDelivery}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedDelivery: e.target.value })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNumber: e.target.value })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceDate: e.target.value })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Items</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-end p-4 border border-gray-200 rounded-lg"
                >
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Item <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.itemId}
                      onChange={(e) =>
                        handleItemChange(index, 'itemId', e.target.value)
                      }
                      required
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">Select Item</option>
                      {itemsData?.map((catalogItem) => (
                        <option key={catalogItem.id} value={catalogItem.id}>
                          {catalogItem.itemName} {catalogItem.modelVariant && `- ${catalogItem.modelVariant}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', e.target.value)
                      }
                      min="0.01"
                      step="0.01"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Purchase Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(index, 'unitPrice', e.target.value)
                      }
                      min="0"
                      step="0.01"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Sales Price
                    </label>
                    <input
                      type="number"
                      value={item.salesPrice ?? ''}
                      onChange={(e) =>
                        handleItemChange(index, 'salesPrice', e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tax Rate (%)
                    </label>
                    <select
                      value={item.taxRate}
                      onChange={(e) =>
                        handleItemChange(index, 'taxRate', e.target.value)
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="0">Select Tax Rate</option>
                      {gstRatesData?.data.map((gstRate) => (
                        <option key={gstRate.id} value={gstRate.rate}>
                          {gstRate.name} ({gstRate.rate}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Total
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {formatCurrency(calculateItemTotal(item))}
                        </p>
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(totals.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax Amount:</span>
                <span className="font-medium">
                  {formatCurrency(totals.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span className="text-indigo-600">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/purchases')}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
