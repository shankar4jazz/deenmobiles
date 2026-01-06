import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoiceApi, Invoice } from '@/services/invoiceApi';
import { X, FileText, Download, MessageCircle, Loader2, RefreshCw, AlertCircle, CheckCircle2, ExternalLink, Printer, Eye } from 'lucide-react';
import { toast } from 'sonner';

// Helper to convert relative PDF URL to absolute URL with cache-busting
const getPdfUrl = (url: string | undefined, cacheBuster?: number): string => {
  if (!url) return '';

  let fullUrl = url;
  if (!url.startsWith('http')) {
    let baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) {
      baseUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';
    }
    fullUrl = `${baseUrl}${url}`;
  }

  const separator = fullUrl.includes('?') ? '&' : '?';
  return `${fullUrl}${separator}t=${cacheBuster || Date.now()}`;
};

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
}

const PAYMENT_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  PARTIAL: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Partial' },
  PAID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
  REFUNDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Refunded' },
};

export function InvoicePreviewModal({
  isOpen,
  onClose,
  serviceId,
}: InvoicePreviewModalProps) {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [pdfVersion, setPdfVersion] = useState<number>(Date.now());

  // Fetch existing invoice by serviceId when modal opens
  const { data: existingInvoice, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['invoice-by-service', serviceId],
    queryFn: () => invoiceApi.getByServiceId(serviceId),
    enabled: isOpen && !hasChecked,
    retry: false,
  });

  // Set invoice from existing data or trigger generation
  useEffect(() => {
    if (isOpen && !isLoadingExisting && !hasChecked) {
      setHasChecked(true);
      if (existingInvoice) {
        setInvoice(existingInvoice);
      }
    }
  }, [isOpen, isLoadingExisting, existingInvoice, hasChecked]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasChecked(false);
      setInvoice(null);
      setIframeError(false);
    }
  }, [isOpen]);

  const generateMutation = useMutation({
    mutationFn: () => invoiceApi.generateFromService(serviceId),
    onSuccess: (data) => {
      setInvoice(data);
      setIframeError(false);
      setPdfVersion(Date.now());
      toast.success('Invoice generated successfully');
    },
    onError: () => {
      toast.error('Failed to generate invoice');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => {
      if (!invoice?.id) throw new Error('No invoice to regenerate');
      return invoiceApi.regeneratePDF(invoice.id);
    },
    onSuccess: (data) => {
      setInvoice(data);
      setIframeError(false);
      setPdfVersion(Date.now());
      toast.success('Invoice PDF regenerated');
    },
    onError: () => {
      toast.error('Failed to regenerate invoice');
    },
  });

  const handleGenerateInvoice = () => {
    generateMutation.mutate();
  };

  const handlePrint = () => {
    if (invoice?.pdfUrl) {
      window.open(getPdfUrl(invoice.pdfUrl, pdfVersion), '_blank');
    }
  };

  const handleDownload = () => {
    if (invoice?.pdfUrl) {
      window.open(getPdfUrl(invoice.pdfUrl, pdfVersion), '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    if (invoice?.pdfUrl) {
      window.open(getPdfUrl(invoice.pdfUrl, pdfVersion), '_blank');
    }
  };

  const handleWhatsAppShare = () => {
    if (invoice) {
      const pdfLink = getPdfUrl(invoice.pdfUrl, pdfVersion);
      const message = `Invoice: ${invoice.invoiceNumber}\nTicket: ${invoice.service?.ticketNumber || ''}\nAmount: ₹${invoice.totalAmount}\nBalance: ₹${invoice.balanceAmount}\n\nView/Download: ${pdfLink}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleViewDetails = () => {
    if (invoice) {
      navigate(`/invoices/${invoice.id}`);
      onClose();
    }
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  const handleRetry = () => {
    generateMutation.mutate();
  };

  if (!isOpen) return null;

  const isLoading = generateMutation.isPending || isLoadingExisting;
  const isRegenerating = regenerateMutation.isPending;
  const paymentStatus = invoice?.paymentStatus ? PAYMENT_STATUS_STYLES[invoice.paymentStatus] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Invoice Preview</h2>
              {invoice && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Invoice: <span className="font-medium">{invoice.invoiceNumber}</span>
                  </p>
                  {paymentStatus && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${paymentStatus.bg} ${paymentStatus.text}`}>
                      {paymentStatus.label}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {invoice && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate PDF"
              >
                <RefreshCw className={`w-5 h-5 text-gray-500 ${isRegenerating ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Invoice Summary */}
        {invoice && (
          <div className="px-6 py-3 border-b bg-gray-50">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Total:</span>
                <span className="ml-1 font-semibold text-gray-900">₹{invoice.totalAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Paid:</span>
                <span className="ml-1 font-semibold text-green-600">₹{invoice.paidAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Balance:</span>
                <span className={`ml-1 font-semibold ${invoice.balanceAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  ₹{invoice.balanceAmount.toLocaleString()}
                </span>
              </div>
              {invoice.service?.customer && (
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <span className="ml-1 font-medium text-gray-900">{invoice.service.customer.name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          {isLoadingExisting ? (
            <div className="h-96 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm">Checking for invoice...</p>
            </div>
          ) : generateMutation.isPending ? (
            <div className="h-96 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm">Generating Invoice...</p>
            </div>
          ) : !invoice && hasChecked ? (
            <div className="h-96 flex flex-col items-center justify-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium mb-2">No Invoice Generated Yet</p>
              <p className="text-sm text-gray-500 mb-6">Click the button below to generate an invoice for this service</p>
              <button
                onClick={handleGenerateInvoice}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">Generate Invoice</span>
              </button>
            </div>
          ) : generateMutation.isError ? (
            <div className="h-96 flex flex-col items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-4">Failed to generate invoice</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : invoice?.pdfUrl ? (
            <div className="h-full flex flex-col items-center justify-center">
              {iframeError ? (
                <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 w-full max-w-md">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Invoice Ready!</p>
                  <p className="text-sm text-gray-500 mb-1">#{invoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-400 mb-6 text-center">
                    PDF preview is not available in this browser.<br />
                    Click below to open in a new tab.
                  </p>
                  <button
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span className="font-medium">Open PDF in New Tab</span>
                  </button>
                </div>
              ) : (
                <iframe
                  key={pdfVersion}
                  src={getPdfUrl(invoice.pdfUrl, pdfVersion)}
                  title={`Invoice ${invoice.invoiceNumber}`}
                  onError={() => setIframeError(true)}
                  onLoad={(e) => {
                    try {
                      const iframe = e.target as HTMLIFrameElement;
                      if (iframe.contentDocument?.body?.innerHTML === '') {
                        setIframeError(true);
                      }
                    } catch {
                      // CORS error means content loaded from different origin - this is OK
                    }
                  }}
                  className="w-full h-[500px] border border-gray-200 rounded-lg"
                />
              )}
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-gray-500">
              <AlertCircle className="w-10 h-10 mb-4" />
              <p className="text-sm">No preview available</p>
              <button
                onClick={handleRetry}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Generate Invoice
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={!invoice?.pdfUrl || isLoading || isRegenerating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium">Print</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!invoice?.pdfUrl || isLoading || isRegenerating}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Download</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              disabled={!invoice?.pdfUrl || isLoading || isRegenerating}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">WhatsApp</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {invoice && (
              <button
                onClick={handleViewDetails}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">View Details</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <span className="text-sm font-medium">Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
