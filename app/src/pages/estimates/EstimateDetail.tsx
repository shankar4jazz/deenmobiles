import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { estimateApi } from '@/services/estimateApi';
import {
  ArrowLeft,
  Download,
  Calendar,
  User,
  Phone,
  FileText,
  Building,
  Package,
  Send,
  CheckCircle,
  XCircle,
  FileCheck,
  Mail,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';

const ESTIMATE_STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CONVERTED: 'bg-purple-100 text-purple-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

export default function EstimateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showSendModal, setShowSendModal] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');

  // Fetch estimate details
  const { data: estimate, isLoading } = useQuery({
    queryKey: ['estimate', id],
    queryFn: () => estimateApi.getById(id!),
    enabled: !!id,
  });

  // Send estimate mutation
  const sendMutation = useMutation({
    mutationFn: (email: string) => estimateApi.sendEstimate(id!, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      setShowSendModal(false);
      setCustomerEmail('');
      alert('Estimate sent successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to send estimate');
    },
  });

  // Approve estimate mutation
  const approveMutation = useMutation({
    mutationFn: () => estimateApi.approve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      alert('Estimate approved successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to approve estimate');
    },
  });

  // Reject estimate mutation
  const rejectMutation = useMutation({
    mutationFn: () => estimateApi.reject(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      alert('Estimate rejected');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to reject estimate');
    },
  });

  // Convert to invoice mutation
  const convertMutation = useMutation({
    mutationFn: () => estimateApi.convertToInvoice(id!),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      alert('Estimate converted to invoice successfully');
      navigate(`/invoices/${invoice.id}`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to convert estimate');
    },
  });

  // Regenerate PDF mutation
  const regeneratePDFMutation = useMutation({
    mutationFn: () => estimateApi.regeneratePDF(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      alert('PDF regenerated successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to regenerate PDF');
    },
  });

  const handleDownloadPDF = async (format: 'A4' | 'A5' | 'thermal-2' | 'thermal-3') => {
    if (estimate?.id) {
      try {
        // Call API to generate PDF with format parameter
        const response = await estimateApi.getPDF(estimate.id, format);
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

  const handleSendEstimate = () => {
    if (customerEmail) {
      sendMutation.mutate(customerEmail);
    }
  };

  const handleApprove = () => {
    if (confirm('Are you sure you want to approve this estimate?')) {
      approveMutation.mutate();
    }
  };

  const handleReject = () => {
    if (confirm('Are you sure you want to reject this estimate?')) {
      rejectMutation.mutate();
    }
  };

  const handleConvert = () => {
    if (confirm('Convert this estimate to an invoice?')) {
      convertMutation.mutate();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="text-gray-500 mt-2">Loading estimate details...</p>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Estimate not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/estimates')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {estimate.estimateNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {estimate.service
                ? `Service: ${estimate.service.ticketNumber}`
                : 'Standalone Estimate'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {estimate.status === 'DRAFT' && (
            <button
              onClick={() => setShowSendModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send to Customer
            </button>
          )}
          {estimate.status === 'SENT' && (
            <>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}
          {estimate.status === 'APPROVED' && !estimate.convertedInvoice && (
            <button
              onClick={handleConvert}
              disabled={convertMutation.isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              Convert to Invoice
            </button>
          )}
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
              ESTIMATE_STATUS_COLORS[estimate.status]
            }`}
          >
            {estimate.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Service Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Estimate Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Customer</div>
                  <div className="font-medium text-gray-900">
                    {estimate.customer?.name}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" />
                    {estimate.customer?.phone}
                  </div>
                  {estimate.customer?.email && (
                    <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Mail className="w-4 h-4" />
                      {estimate.customer.email}
                    </div>
                  )}
                </div>
              </div>

              {estimate.service && (
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Linked Service</div>
                    <div className="font-medium text-gray-900">
                      {estimate.service.ticketNumber}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {estimate.service.deviceModel}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {estimate.service.issue}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium text-gray-900">
                    {formatDateTime(estimate.createdAt)}
                  </div>
                </div>
              </div>

              {estimate.validUntil && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Valid Until</div>
                    <div className="font-medium text-gray-900">
                      {formatDate(estimate.validUntil)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {estimate.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Notes</div>
                <div className="text-sm text-gray-700">{estimate.notes}</div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {estimate.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Timeline */}
          {(estimate.sentAt || estimate.approvedAt || estimate.convertedAt) && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Status Timeline
              </h2>
              <div className="space-y-3">
                {estimate.sentAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <Send className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Sent to customer:</span>
                    <span className="font-medium text-gray-900">
                      {formatDateTime(estimate.sentAt)}
                    </span>
                  </div>
                )}
                {estimate.approvedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Approved:</span>
                    <span className="font-medium text-gray-900">
                      {formatDateTime(estimate.approvedAt)}
                    </span>
                  </div>
                )}
                {estimate.convertedAt && estimate.convertedInvoice && (
                  <div className="flex items-center gap-3 text-sm">
                    <FileCheck className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">Converted to Invoice:</span>
                    <button
                      onClick={() =>
                        navigate(`/invoices/${estimate.convertedInvoice?.id}`)
                      }
                      className="font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      {estimate.convertedInvoice.invoiceNumber}
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
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
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(estimate.subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tax (GST)</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(estimate.taxAmount)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-gray-900 font-semibold">Total Amount</span>
                <span className="font-bold text-xl text-purple-600">
                  {formatCurrency(estimate.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Send Estimate to Customer
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder={estimate.customer?.email || 'customer@example.com'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The estimate PDF will be sent to this email address
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setCustomerEmail('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEstimate}
                disabled={!customerEmail || sendMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendMutation.isPending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Estimate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
