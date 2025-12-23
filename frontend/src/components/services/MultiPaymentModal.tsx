import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, CreditCard, Check, Truck } from 'lucide-react';
import { serviceApi, ServiceStatus, BulkPaymentEntryData } from '@/services/serviceApi';
import { masterDataApi } from '@/services/masterDataApi';
import { toast } from 'sonner';

interface PricingSummary {
  estimatePrice: number;
  extraSpareTotal: number;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
}

interface MultiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  pricingSummary: PricingSummary;
  currentStatus: ServiceStatus;
}

interface PaymentMethodEntry {
  paymentMethodId: string;
  paymentMethodName: string;
  amount: string;
}

export default function MultiPaymentModal({
  isOpen,
  onClose,
  serviceId,
  pricingSummary,
  currentStatus,
}: MultiPaymentModalProps) {
  const queryClient = useQueryClient();

  // State for payment entries (keyed by payment method id)
  const [paymentEntries, setPaymentEntries] = useState<Record<string, PaymentMethodEntry>>({});
  const [markAsDelivered, setMarkAsDelivered] = useState(false);
  const [globalNotes, setGlobalNotes] = useState('');

  // Fetch payment methods
  const { data: paymentMethodsData, isLoading: isLoadingMethods } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => masterDataApi.paymentMethods.getAll({ limit: 100, isActive: true }),
    enabled: isOpen,
  });

  // Initialize payment entries when methods load
  useEffect(() => {
    if (paymentMethodsData?.data && Object.keys(paymentEntries).length === 0) {
      const initial: Record<string, PaymentMethodEntry> = {};
      paymentMethodsData.data.forEach((method) => {
        initial[method.id] = {
          paymentMethodId: method.id,
          paymentMethodName: method.name,
          amount: '',
        };
      });
      setPaymentEntries(initial);
    }
  }, [paymentMethodsData, paymentEntries]);

  // Calculate totals
  const totalEntered = useMemo(() => {
    return Object.values(paymentEntries).reduce((sum, entry) => {
      const amount = parseFloat(entry.amount) || 0;
      return sum + amount;
    }, 0);
  }, [paymentEntries]);

  const remainingBalance = pricingSummary.balanceDue - totalEntered;

  // Auto-check delivered when balance is 0
  useEffect(() => {
    if (remainingBalance <= 0 && totalEntered > 0 && currentStatus !== ServiceStatus.DELIVERED) {
      setMarkAsDelivered(true);
    }
  }, [remainingBalance, totalEntered, currentStatus]);

  // Bulk payment mutation
  const bulkPaymentMutation = useMutation({
    mutationFn: () => {
      const validPayments = Object.values(paymentEntries)
        .filter((entry) => parseFloat(entry.amount) > 0)
        .map((entry) => ({
          amount: parseFloat(entry.amount),
          paymentMethodId: entry.paymentMethodId,
        }));

      const data: BulkPaymentEntryData = {
        payments: validPayments,
        notes: globalNotes || undefined,
        markAsDelivered,
      };

      return serviceApi.addBulkPaymentEntries(serviceId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      toast.success(markAsDelivered ? 'Payment collected & marked as delivered' : 'Payment collected successfully');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to collect payment');
    },
  });

  const resetForm = () => {
    setPaymentEntries({});
    setMarkAsDelivered(false);
    setGlobalNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if at least one payment has amount > 0
    const hasValidPayment = Object.values(paymentEntries).some(
      (entry) => parseFloat(entry.amount) > 0
    );

    if (!hasValidPayment) {
      toast.error('Please enter at least one payment amount');
      return;
    }

    bulkPaymentMutation.mutate();
  };

  const updatePaymentEntry = (methodId: string, value: string) => {
    setPaymentEntries((prev) => ({
      ...prev,
      [methodId]: {
        ...prev[methodId],
        amount: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Collect Payment</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Two Column Layout: Cash Tender (Left) | Payment Summary (Right) */}
          <div className="grid grid-cols-2 gap-6">
            {/* LEFT: Cash Tender */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Cash Tender</h3>
              {isLoadingMethods ? (
                <div className="text-center py-4 text-gray-500">Loading payment methods...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethodsData?.data.map((method) => (
                    <div key={method.id} className="border border-gray-200 rounded-lg p-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {method.name}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={paymentEntries[method.id]?.amount || ''}
                          onChange={(e) => updatePaymentEntry(method.id, e.target.value)}
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Collection Summary */}
              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Total Entered</span>
                  <span className="font-semibold text-blue-700">₹{totalEntered.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className={`font-semibold ${remainingBalance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    ₹{remainingBalance.toFixed(2)}
                    {remainingBalance <= 0 && totalEntered > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" /> Fully Paid
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: Payment Summary */}
            <div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Payment Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estimate Price</span>
                  <span className="font-medium">₹{pricingSummary.estimatePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Extra Spare Parts</span>
                  <span className="font-medium">₹{pricingSummary.extraSpareTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 my-2" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Amount</span>
                  <span>₹{pricingSummary.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Already Paid</span>
                  <span>₹{pricingSummary.advancePaid.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>Balance Due</span>
                  <span className={pricingSummary.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}>
                    ₹{pricingSummary.balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mark as Delivered Checkbox */}
          {currentStatus !== ServiceStatus.DELIVERED && (
            <label className="flex items-center gap-3 p-3 mt-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={markAsDelivered}
                onChange={(e) => setMarkAsDelivered(e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Mark as Delivered</span>
              </div>
            </label>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={globalNotes}
              onChange={(e) => setGlobalNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bulkPaymentMutation.isPending}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            >
              {bulkPaymentMutation.isPending ? 'Processing...' : 'Collect Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
