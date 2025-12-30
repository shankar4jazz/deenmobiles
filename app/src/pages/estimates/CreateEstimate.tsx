import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { estimateApi } from '@/services/estimateApi';
import { serviceApi } from '@/services/serviceApi';
import { themeApi } from '@/services/themeApi';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, ArrowLeft, FileText, Save, Send, Palette } from 'lucide-react';
import SearchableCustomerSelect from '@/components/common/SearchableCustomerSelect';

interface EstimateItem {
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

const TAX_RATE = 18; // 18% GST

export default function CreateEstimate() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    validUntil: '',
    notes: '',
    themeId: '',
  });

  const [items, setItems] = useState<EstimateItem[]>([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  const [sendAfterCreation, setSendAfterCreation] = useState(false);

  // Fetch services for optional linking (only IN_PROGRESS or COMPLETED services)
  const { data: servicesData } = useQuery({
    queryKey: ['services-dropdown'],
    queryFn: () => serviceApi.getAll({ limit: 1000, status: 'IN_PROGRESS,COMPLETED' }),
  });

  // Fetch active themes for PDF styling
  const { data: themesData } = useQuery({
    queryKey: ['themes-active'],
    queryFn: () => themeApi.getAll({ isActive: true, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: estimateApi.create,
    onSuccess: (estimate) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });

      // If user chose to send, navigate to detail page where they can send
      if (sendAfterCreation) {
        navigate(`/estimates/${estimate.id}`);
      } else {
        navigate('/estimates');
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create estimate');
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
    field: keyof EstimateItem,
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

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * TAX_RATE) / 100;
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
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

    const estimateData = {
      customerId: formData.customerId,
      serviceId: formData.serviceId || undefined,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      validUntil: formData.validUntil || undefined,
      notes: formData.notes || undefined,
      themeId: formData.themeId || undefined,
    };

    createMutation.mutate(estimateData);
  };

  const handleSaveAndSend = (e: React.FormEvent) => {
    setSendAfterCreation(true);
    handleSubmit(e, false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/estimates')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7" />
              Create Estimate
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a new estimate/quotation for customer
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Estimate Details
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Service (Optional)
              </label>
              <select
                value={formData.serviceId}
                onChange={(e) =>
                  setFormData({ ...formData, serviceId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">No Service Link</option>
                {servicesData?.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.ticketNumber} - {service.deviceModel}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Optionally link this estimate to an existing service
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                PDF Theme (Optional)
              </label>
              <select
                value={formData.themeId}
                onChange={(e) =>
                  setFormData({ ...formData, themeId: e.target.value })
                }
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
                Choose colors and style for the PDF estimate
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) =>
                  setFormData({ ...formData, validUntil: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
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
                placeholder="Add any additional notes or terms..."
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
                    placeholder="e.g., Screen Replacement, Battery Replacement"
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

        {/* Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Estimate Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (GST {TAX_RATE}%):</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(totals.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total Amount:</span>
              <span className="text-purple-600">
                {formatCurrency(totals.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/estimates')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={handleSaveAndSend}
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {createMutation.isPending ? 'Saving...' : 'Save & Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
