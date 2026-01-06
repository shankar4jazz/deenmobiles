import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Search,
  Truck,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
  User,
  Phone,
  Smartphone,
  FileText,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { serviceApi, Service, DeliveryStatus, BulkPaymentEntryData } from '@/services/serviceApi';
import { masterDataApi } from '@/services/masterDataApi';
import { invoiceApi } from '@/services/invoiceApi';
import { toast } from 'sonner';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentMethodEntry {
  paymentMethodId: string;
  paymentMethodName: string;
  amount: string;
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('en-IN').format(value);
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' },
    WAITING_PARTS: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Waiting Parts' },
    READY: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready' },
    NOT_READY: { bg: 'bg-red-100', text: 'text-red-800', label: 'Not Ready' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    DELIVERED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Delivered' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
    NOT_SERVICEABLE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Not Serviceable' },
  };
  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default function DeliveryModal({ isOpen, onClose }: DeliveryModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<string | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [paymentEntries, setPaymentEntries] = useState<Record<string, PaymentMethodEntry>>({});
  const [markAsDelivered, setMarkAsDelivered] = useState(true);

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

  // Calculate pricing
  const pricingSummary = useMemo(() => {
    if (!service) return null;

    const estimatePrice = service.estimatedCost || 0;
    const extraSpareTotal = (service.sparePartsUsed || []).reduce(
      (sum, part) => sum + (part.sellingPrice || 0) * (part.quantity || 1),
      0
    );
    const totalAmount = estimatePrice + extraSpareTotal;
    const discount = service.discount || 0;
    const finalAmount = totalAmount - discount;
    const advancePaid = (service.paymentEntries || []).reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = finalAmount - advancePaid;

    return { estimatePrice, extraSpareTotal, totalAmount, discount, finalAmount, advancePaid, balanceDue };
  }, [service]);

  const totalEntered = useMemo(() => {
    return Object.values(paymentEntries).reduce((sum, entry) => {
      const amount = parseFloat(entry.amount) || 0;
      return sum + amount;
    }, 0);
  }, [paymentEntries]);

  const remainingBalance = (pricingSummary?.balanceDue || 0) - totalEntered;

  // Auto-mark as delivered when fully paid
  useEffect(() => {
    if (remainingBalance <= 0 && totalEntered > 0 && service?.deliveryStatus !== DeliveryStatus.DELIVERED) {
      setMarkAsDelivered(true);
    }
  }, [remainingBalance, totalEntered, service?.deliveryStatus]);

  // Search for service
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a ticket number');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setService(null);

    try {
      const result = await serviceApi.getAllServices({
        ticketNumber: searchQuery.trim(),
        limit: 1,
      });

      if (result.services.length === 0) {
        setSearchError('No service found with this ticket number');
      } else {
        setService(result.services[0]);
        setSearchedTicket(searchQuery.trim());
        // Reset payment entries
        if (paymentMethodsData?.data) {
          const reset: Record<string, PaymentMethodEntry> = {};
          paymentMethodsData.data.forEach((method) => {
            reset[method.id] = {
              paymentMethodId: method.id,
              paymentMethodName: method.name,
              amount: '',
            };
          });
          setPaymentEntries(reset);
        }
      }
    } catch (error: any) {
      setSearchError(error.response?.data?.message || 'Failed to search service');
    } finally {
      setIsSearching(false);
    }
  };

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: () => {
      if (!service) throw new Error('No service selected');

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

      return serviceApi.addBulkPaymentEntries(service.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', service?.id] });
      toast.success(markAsDelivered ? 'Payment collected & delivered' : 'Payment collected');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to collect payment');
    },
  });

  // Invoice mutation
  const invoiceMutation = useMutation({
    mutationFn: () => {
      if (!service) throw new Error('No service selected');
      return invoiceApi.generateInvoice(service.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice generated successfully');
      // Open invoice in new tab if PDF URL available
      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
    },
  });

  const handleClose = () => {
    setSearchQuery('');
    setSearchedTicket(null);
    setService(null);
    setSearchError(null);
    setPaymentEntries({});
    setMarkAsDelivered(true);
    onClose();
  };

  const handleCollectPayment = () => {
    const hasValidPayment = Object.values(paymentEntries).some(
      (entry) => parseFloat(entry.amount) > 0
    );

    if (!hasValidPayment && !markAsDelivered) {
      toast.error('Please enter payment amount or mark as delivered');
      return;
    }

    paymentMutation.mutate();
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  const isAlreadyDelivered = service?.deliveryStatus === DeliveryStatus.DELIVERED;
  const canCollectPayment = service && !isAlreadyDelivered && (pricingSummary?.balanceDue || 0) > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Quick Delivery</h2>
              <p className="text-green-100 text-sm">Search ticket, collect payment, deliver</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Ticket Number
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter ticket number (e.g., TKT-2024-0001)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                Search
              </button>
            </div>
            {searchError && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {searchError}
              </div>
            )}
          </div>

          {/* Service Details */}
          {service && (
            <div className="space-y-4">
              {/* Service Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-green-600">
                        {service.ticketNumber}
                      </span>
                      {getStatusBadge(service.status)}
                      {isAlreadyDelivered && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Delivered
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(service.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleClose();
                      navigate(`/services/${service.id}`);
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Full Details
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Customer</h4>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">{service.customer?.name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{service.customer?.phone || '-'}</span>
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Device</h4>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">{service.deviceModel || '-'}</span>
                    </div>
                    {service.deviceIMEI && (
                      <p className="text-xs text-gray-500 ml-6">IMEI: {service.deviceIMEI}</p>
                    )}
                  </div>
                </div>

                {/* Faults */}
                {service.faults && service.faults.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Faults</h4>
                    <div className="flex flex-wrap gap-1">
                      {service.faults.map((fault) => (
                        <span
                          key={fault.id}
                          className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full"
                        >
                          {fault.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Section */}
              {pricingSummary && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Left: Payment Methods */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      Collect Payment
                    </h3>
                    {isLoadingMethods ? (
                      <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
                    ) : (
                      <div className="space-y-2">
                        {paymentMethodsData?.data.map((method) => (
                          <div key={method.id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{method.name}</span>
                            <div className="relative w-28">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={paymentEntries[method.id]?.amount || ''}
                                onChange={(e) => updatePaymentEntry(method.id, e.target.value)}
                                disabled={isAlreadyDelivered || pricingSummary.balanceDue <= 0}
                                className="w-full pl-5 pr-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Entered</span>
                            <span className="font-semibold text-green-600">
                              ₹{formatCurrency(totalEntered)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-500">Remaining</span>
                            <span
                              className={`font-medium ${
                                remainingBalance <= 0 ? 'text-green-600' : 'text-orange-600'
                              }`}
                            >
                              {remainingBalance <= 0 && totalEntered > 0 ? (
                                <span className="flex items-center gap-1">
                                  <Check className="h-4 w-4" /> Paid
                                </span>
                              ) : (
                                `₹${formatCurrency(remainingBalance)}`
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Pricing Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Pricing Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estimate</span>
                        <span>₹{formatCurrency(pricingSummary.estimatePrice)}</span>
                      </div>
                      {pricingSummary.extraSpareTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Extra Spare</span>
                          <span>₹{formatCurrency(pricingSummary.extraSpareTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Total</span>
                        <span className="font-semibold">₹{formatCurrency(pricingSummary.totalAmount)}</span>
                      </div>
                      {pricingSummary.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount</span>
                          <span>-₹{formatCurrency(pricingSummary.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-green-600">
                        <span>Already Paid</span>
                        <span>₹{formatCurrency(pricingSummary.advancePaid)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-bold">Balance Due</span>
                        <span
                          className={`font-bold text-lg ${
                            pricingSummary.balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          ₹{formatCurrency(pricingSummary.balanceDue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mark as Delivered */}
              {!isAlreadyDelivered && (
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={markAsDelivered}
                    onChange={(e) => setMarkAsDelivered(e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-700">Mark as Delivered</span>
                </label>
              )}

              {isAlreadyDelivered && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3">
                  <Check className="h-5 w-5 text-purple-600" />
                  <span className="text-purple-700 font-medium">
                    This service has already been delivered
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!service && !isSearching && !searchError && (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Enter a ticket number to search for a service</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {service && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => invoiceMutation.mutate()}
              disabled={invoiceMutation.isPending}
              className="px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {invoiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Receipt className="h-4 w-4" />
              )}
              Generate Invoice
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              {!isAlreadyDelivered && (
                <button
                  onClick={handleCollectPayment}
                  disabled={paymentMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center gap-2"
                >
                  {paymentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {totalEntered > 0 && markAsDelivered
                    ? 'Collect & Deliver'
                    : markAsDelivered
                    ? 'Mark Delivered'
                    : 'Collect Payment'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
