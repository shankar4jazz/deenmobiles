import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceApi } from '@/services/invoiceApi';
import { masterDataApi } from '@/services/masterDataApi';
import {
  ArrowLeft,
  Download,
  DollarSign,
  CreditCard,
  Calendar,
  User,
  Phone,
  FileText,
  Building,
  Package,
  ChevronDown,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PAYMENT_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Fetch invoice details
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.getById(id!),
    enabled: !!id,
  });

  // Fetch payment methods
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => masterDataApi.getAllPaymentMethods({ isActive: true, limit: 100 }),
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: () =>
      invoiceApi.recordPayment(id!, {
        amount: parseFloat(paymentAmount),
        paymentMethodId,
        transactionId: transactionId || undefined,
        notes: paymentNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMethodId('');
      setTransactionId('');
      setPaymentNotes('');
    },
  });

  // Sync from service mutation
  const syncFromServiceMutation = useMutation({
    mutationFn: () => invoiceApi.syncFromService(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Invoice synced from service successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to sync invoice');
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: () => invoiceApi.delete(id!),
    onSuccess: () => {
      toast.success('Invoice deleted successfully');
      navigate('/branch/invoices');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    },
  });

  const handleDownloadPDF = async (format: 'A4' | 'A5' | 'thermal-2' | 'thermal-3') => {
    if (invoice?.id) {
      try {
        // Call API to generate PDF with format parameter
        const response = await invoiceApi.downloadPDF(invoice.id, format);
        // Open the returned static URL
        if (response.pdfUrl) {
          window.open(response.pdfUrl, '_blank');
        }
        setShowDownloadDropdown(false);
      } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF. Please try again.');
      }
    }
  };

  const handleRecordPayment = () => {
    if (paymentAmount && paymentMethodId) {
      recordPaymentMutation.mutate();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="text-gray-500 mt-2">Loading invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/branch/invoices')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Service: {invoice.service?.ticketNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {invoice.balanceAmount > 0 && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Record Payment
            </button>
          )}
          {/* Sync from Service button - only for service-linked invoices */}
          {invoice.serviceId && (
            <button
              onClick={() => syncFromServiceMutation.mutate()}
              disabled={syncFromServiceMutation.isPending}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Recalculate totals from current service data"
            >
              <RefreshCw className={`w-4 h-4 ${syncFromServiceMutation.isPending ? 'animate-spin' : ''}`} />
              Sync
            </button>
          )}
          {/* Delete Invoice button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
                deleteInvoiceMutation.mutate();
              }
            }}
            disabled={deleteInvoiceMutation.isPending}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Delete this invoice"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
              <ChevronDown className="w-4 h-4" />
            </button>
            {showDownloadDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleDownloadPDF('A4')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                >
                  <FileText className="w-4 h-4" />
                  A4 PDF
                </button>
                <button
                  onClick={() => handleDownloadPDF('A5')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  A5 PDF
                </button>
                <button
                  onClick={() => handleDownloadPDF('thermal-2')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Thermal 2"
                </button>
                <button
                  onClick={() => handleDownloadPDF('thermal-3')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 rounded-b-lg"
                >
                  <FileText className="w-4 h-4" />
                  Thermal 3"
                </button>
              </div>
            )}
          </div>
          <span
            className={`px-4 py-2 text-sm font-semibold rounded-full ${
              PAYMENT_STATUS_COLORS[invoice.paymentStatus]
            }`}
          >
            {invoice.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Service Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Invoice Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Customer</div>
                  <div className="font-medium text-gray-900">
                    {invoice.service?.customer?.name}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" />
                    {invoice.service?.customer?.phone}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Device</div>
                  <div className="font-medium text-gray-900">
                    {invoice.service?.deviceModel}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {invoice.service?.issue}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium text-gray-900">
                    {formatDate(invoice.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Branch</div>
                  <div className="font-medium text-gray-900">
                    {invoice.branch?.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment History
            </h2>
            {!invoice.payments || invoice.payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments recorded yet</p>
            ) : (
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <CreditCard className="w-4 h-4" />
                        {payment.paymentMethod?.name}
                        {payment.transactionId && ` • ${payment.transactionId}`}
                      </div>
                      {payment.notes && (
                        <div className="text-xs text-gray-600 mt-1">
                          {payment.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(payment.paymentDate || payment.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Amount Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Paid Amount</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-gray-900 font-medium">Balance Due</span>
                <span className="font-bold text-lg text-orange-600">
                  {formatCurrency(invoice.balanceAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record Payment
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  max={invoice.balanceAmount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Balance due: {formatCurrency(invoice.balanceAmount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select payment method</option>
                  {paymentMethodsData?.data?.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add any notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!paymentAmount || !paymentMethodId || recordPaymentMutation.isPending}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
