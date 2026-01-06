import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, CreditCard, Check, Truck } from 'lucide-react';
import { serviceApi, DeliveryStatus, BulkPaymentEntryData } from '@/services/serviceApi';
import { masterDataApi } from '@/services/masterDataApi';
import { toast } from 'sonner';

interface PricingSummary {
  estimatePrice: number;
  extraSpareTotal: number;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  advancePaid: number;
  balanceDue: number;
}

interface MultiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  pricingSummary: PricingSummary;
  currentDeliveryStatus?: DeliveryStatus;
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
  currentDeliveryStatus,
}: MultiPaymentModalProps) {
  const queryClient = useQueryClient();

  const [paymentEntries, setPaymentEntries] = useState<Record<string, PaymentMethodEntry>>({});
  const [markAsDelivered, setMarkAsDelivered] = useState(false);

  const { data: paymentMethodsData, isLoading: isLoadingMethods } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => masterDataApi.paymentMethods.getAll({ limit: 100, isActive: true }),
    enabled: isOpen,
  });

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

  const totalEntered = useMemo(() => {
    return Object.values(paymentEntries).reduce((sum, entry) => {
      const amount = parseFloat(entry.amount) || 0;
      return sum + amount;
    }, 0);
  }, [paymentEntries]);

  const remainingBalance = pricingSummary.balanceDue - totalEntered;

  useEffect(() => {
    if (remainingBalance <= 0 && totalEntered > 0 && currentDeliveryStatus !== DeliveryStatus.DELIVERED) {
      setMarkAsDelivered(true);
    }
  }, [remainingBalance, totalEntered, currentDeliveryStatus]);

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
        markAsDelivered,
      };

      return serviceApi.addBulkPaymentEntries(serviceId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      toast.success(markAsDelivered ? 'Payment collected & delivered' : 'Payment collected');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to collect payment');
    },
  });

  const resetForm = () => {
    setPaymentEntries({});
    setMarkAsDelivered(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="border-b px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-900">Collect Payment</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* LEFT: Cash Details */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Cash Details</h3>
              {isLoadingMethods ? (
                <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {paymentMethodsData?.data.map((method) => (
                      <tr key={method.id}>
                        <td className="py-1.5 text-gray-600">{method.name}</td>
                        <td className="py-1.5 w-28">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={paymentEntries[method.id]?.amount || ''}
                              onChange={(e) => updatePaymentEntry(method.id, e.target.value)}
                              className="w-full pl-5 pr-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-green-500 focus:border-green-500"
                              placeholder="0"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t">
                      <td className="py-2 font-medium">Total Entered</td>
                      <td className="py-2 text-right font-semibold text-green-600">₹{totalEntered.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-500">Remaining</td>
                      <td className={`py-1 text-right font-medium ${remainingBalance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {remainingBalance <= 0 && totalEntered > 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            <Check className="w-4 h-4" /> Paid
                          </span>
                        ) : (
                          `₹${remainingBalance.toFixed(2)}`
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* RIGHT: Details */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Details</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-500">Estimate</td>
                    <td className="py-1 text-right font-medium">₹{pricingSummary.estimatePrice.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-500">Extra Spare</td>
                    <td className="py-1 text-right font-medium">₹{pricingSummary.extraSpareTotal.toFixed(2)}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-1 font-medium">Total</td>
                    <td className="py-1 text-right font-semibold">₹{pricingSummary.totalAmount.toFixed(2)}</td>
                  </tr>
                  {pricingSummary.discount > 0 && (
                    <tr>
                      <td className="py-1 text-red-600">Discount</td>
                      <td className="py-1 text-right text-red-600">-₹{pricingSummary.discount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1 text-green-600">Paid</td>
                    <td className="py-1 text-right text-green-600">₹{pricingSummary.advancePaid.toFixed(2)}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-2 font-bold">Balance Due</td>
                    <td className={`py-2 text-right font-bold text-lg ${pricingSummary.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{pricingSummary.balanceDue.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mark as Delivered */}
          {currentDeliveryStatus !== DeliveryStatus.DELIVERED && (
            <label className="flex items-center gap-2 mt-4 p-2 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={markAsDelivered}
                onChange={(e) => setMarkAsDelivered(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <Truck className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700">Mark as Delivered</span>
            </label>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bulkPaymentMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              {bulkPaymentMutation.isPending ? 'Processing...' : 'Collect Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
