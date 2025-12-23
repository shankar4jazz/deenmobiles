import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, Search, Loader2, Package, AlertCircle } from 'lucide-react';
import { salesReturnApi } from '@/services/salesReturnApi';
import { useAuthStore } from '@/store/authStore';
import type { EligibleInvoice, SalesReturnReason } from '@/types';
import { toast } from 'sonner';

interface CreateReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ReturnItem {
  invoiceItemId: string;
  description: string;
  originalQty: number;
  availableQty: number;
  returnQuantity: number;
  unitPrice: number;
  reason?: string;
}

const RETURN_REASONS: { value: SalesReturnReason; label: string }[] = [
  { value: 'DEFECTIVE', label: 'Defective Item' },
  { value: 'WRONG_ITEM', label: 'Wrong Item' },
  { value: 'CUSTOMER_CHANGED_MIND', label: 'Customer Changed Mind' },
  { value: 'DUPLICATE_BILLING', label: 'Duplicate Billing' },
  { value: 'PRICE_ADJUSTMENT', label: 'Price Adjustment' },
  { value: 'OTHER', label: 'Other' },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function CreateReturnModal({ isOpen, onClose, onSuccess }: CreateReturnModalProps) {
  const user = useAuthStore((state) => state.user);
  const branchId = user?.activeBranch?.id || '';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<EligibleInvoice | null>(null);
  const [isFullReturn, setIsFullReturn] = useState(true);
  const [returnReason, setReturnReason] = useState<SalesReturnReason>('DEFECTIVE');
  const [notes, setNotes] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  // Fetch eligible invoices
  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['eligible-invoices', branchId, searchQuery],
    queryFn: () => salesReturnApi.getEligibleInvoices(branchId, searchQuery),
    enabled: isOpen && !selectedInvoice,
  });

  // Create return mutation
  const createMutation = useMutation({
    mutationFn: salesReturnApi.createReturn,
    onSuccess: () => {
      toast.success('Sales return created successfully!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create return');
    },
  });

  // Initialize return items when invoice is selected
  useEffect(() => {
    if (selectedInvoice) {
      const items = selectedInvoice.items.map((item) => {
        const alreadyReturned = item.salesReturnItems.reduce(
          (sum, ret) => sum + ret.returnQuantity,
          0
        );
        const availableQty = item.quantity - alreadyReturned;
        return {
          invoiceItemId: item.id,
          description: item.description,
          originalQty: item.quantity,
          availableQty,
          returnQuantity: isFullReturn ? availableQty : 0,
          unitPrice: item.unitPrice,
          reason: '',
        };
      });
      setReturnItems(items);
    }
  }, [selectedInvoice, isFullReturn]);

  // Calculate total return amount
  const totalReturnAmount = returnItems.reduce(
    (sum, item) => sum + item.returnQuantity * item.unitPrice,
    0
  );

  // Check if form is valid
  const isValid =
    selectedInvoice &&
    returnReason &&
    returnItems.some((item) => item.returnQuantity > 0);

  const handleSelectInvoice = (invoice: EligibleInvoice) => {
    setSelectedInvoice(invoice);
  };

  const handleQuantityChange = (index: number, value: number) => {
    const items = [...returnItems];
    items[index].returnQuantity = Math.min(Math.max(0, value), items[index].availableQty);
    setReturnItems(items);
  };

  const handleSubmit = () => {
    if (!selectedInvoice || !branchId) return;

    const items = isFullReturn
      ? undefined
      : returnItems
          .filter((item) => item.returnQuantity > 0)
          .map((item) => ({
            invoiceItemId: item.invoiceItemId,
            returnQuantity: item.returnQuantity,
            reason: item.reason,
          }));

    createMutation.mutate({
      invoiceId: selectedInvoice.id,
      returnReason,
      notes: notes || undefined,
      branchId,
      isFullReturn,
      items,
    });
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedInvoice(null);
    setIsFullReturn(true);
    setReturnReason('DEFECTIVE');
    setNotes('');
    setReturnItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Create Sales Return</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedInvoice ? (
            /* Invoice Selection */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Invoice
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by invoice number, customer name, or phone..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {loadingInvoices ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">Loading invoices...</p>
                </div>
              ) : !invoices || invoices.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No eligible invoices</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Only standalone invoices with returnable items are shown
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {invoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      onClick={() => handleSelectInvoice(invoice)}
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-indigo-600">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-900 mt-1">{invoice.customer?.name}</p>
                          <p className="text-xs text-gray-500">{invoice.customer?.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatCurrency(invoice.totalAmount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {invoice.items.length} item(s)
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Return Form */
            <div className="space-y-6">
              {/* Selected Invoice Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Selected Invoice</p>
                    <p className="font-medium text-indigo-600">{selectedInvoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-900">{selectedInvoice.customer?.name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Return Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Return Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={isFullReturn}
                      onChange={() => setIsFullReturn(true)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Full Return</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!isFullReturn}
                      onChange={() => setIsFullReturn(false)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Partial Return</span>
                  </label>
                </div>
              </div>

              {/* Return Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value as SalesReturnReason)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  {RETURN_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items to Return
                </label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Original
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Available
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Return Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {returnItems.map((item, index) => (
                        <tr key={item.invoiceItemId}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-500">
                            {item.originalQty}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-500">
                            {item.availableQty}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isFullReturn ? (
                              <span className="text-sm text-gray-900">{item.returnQuantity}</span>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                max={item.availableQty}
                                value={item.returnQuantity}
                                onChange={(e) =>
                                  handleQuantityChange(index, parseInt(e.target.value) || 0)
                                }
                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                disabled={item.availableQty === 0}
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            {formatCurrency(item.returnQuantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                          Total Return Amount:
                        </td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-orange-600">
                          {formatCurrency(totalReturnAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this return..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedInvoice && (
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || createMutation.isPending}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Return'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
