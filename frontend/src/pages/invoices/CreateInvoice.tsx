import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '@/services/invoiceApi';
import { invoiceTemplateApi } from '@/services/invoiceTemplateApi';
import { masterDataApi } from '@/services/masterDataApi';
import { themeApi } from '@/services/themeApi';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, ArrowLeft, FileText, Save, FileCheck, Palette } from 'lucide-react';
import SearchableCustomerSelect from '@/components/common/SearchableCustomerSelect';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

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

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Fetch active templates
  const { data: templatesData } = useQuery({
    queryKey: ['invoice-templates-active'],
    queryFn: () => invoiceTemplateApi.getAll({ isActive: true, limit: 100 }),
  });

  // Fetch payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => masterDataApi.getPaymentMethods(),
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
      navigate(`/branch/invoices/${invoice.id}`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      { description: '', quantity: 1, unitPrice: 0, amount: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];

    if (field === 'description') {
      newItems[index][field] = value as string;
    } else {
      newItems[index][field] = Number(value);

      // Recalculate amount when quantity or unitPrice changes
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
      }
    }

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

      // Load template data
      setFormData(prev => ({
        ...prev,
        taxRate: template.taxRate,
        notes: template.notes || prev.notes,
      }));

      // Load template items
      setItems(template.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
      })));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to load template');
      setSelectedTemplateId('');
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    const balanceAmount = totalAmount - formData.paidAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount,
      balanceAmount,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.activeBranch?.id) {
      alert('Please select a branch first');
      return;
    }

    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }

    if (items.some((item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0)) {
      alert('Please fill in all item details correctly');
      return;
    }

    if (formData.paidAmount > 0 && !formData.paymentMethodId) {
      alert('Please select a payment method for the paid amount');
      return;
    }

    const invoiceData = {
      customerId: formData.customerId,
      branchId: user.activeBranch.id,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
      totalAmount: totals.totalAmount,
      paidAmount: formData.paidAmount || 0,
      notes: formData.notes || undefined,
      themeId: formData.themeId || undefined,
    };

    createMutation.mutate(invoiceData);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/branch/invoices')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7" />
              Create Invoice
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a new standalone invoice
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <SearchableCustomerSelect
                value={formData.customerId}
                onChange={(customerId) =>
                  setFormData({ ...formData, customerId })
                }
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
              <p className="text-xs text-gray-500 mt-1">
                Select a template to auto-fill invoice items
              </p>
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
                {themesData?.themes?.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name} {theme.isDefault && '⭐'}
                  </option>
                )) || null}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose colors and style for the PDF invoice
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
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
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 items-start p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="col-span-12 md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, 'description', e.target.value)
                    }
                    placeholder="e.g., Product or Service Description"
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
                    onChange={(e) =>
                      handleItemChange(index, 'quantity', e.target.value)
                    }
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
                    onChange={(e) =>
                      handleItemChange(index, 'unitPrice', e.target.value)
                    }
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-4 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-900">
                    {formatCurrency(item.amount)}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-1 flex items-end">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-5 h-5 mx-auto" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Details (Optional)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paid Amount
              </label>
              <input
                type="number"
                value={formData.paidAmount}
                onChange={(e) =>
                  setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })
                }
                min="0"
                max={totals.totalAmount}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave as 0 if no payment received yet
              </p>
            </div>

            {formData.paidAmount > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paymentMethodId}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethodId: e.target.value })
                  }
                  required={formData.paidAmount > 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Payment Method</option>
                  {paymentMethods?.map((method) => (
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Invoice Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (GST {formData.taxRate}%):</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(totals.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-3">
              <span>Total Amount:</span>
              <span className="text-purple-600">
                {formatCurrency(totals.totalAmount)}
              </span>
            </div>
            {formData.paidAmount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(formData.paidAmount)}
                  </span>
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
            onClick={() => navigate('/branch/invoices')}
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
