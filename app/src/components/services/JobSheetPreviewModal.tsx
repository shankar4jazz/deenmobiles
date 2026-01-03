import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { jobSheetApi, JobSheet, JobSheetFormat, JobSheetCopyType } from '@/services/jobSheetApi';
import { X, Printer, Download, MessageCircle, ArrowRight, Loader2, RefreshCw, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// Helper to convert relative PDF URL to absolute URL with cache-busting
const getPdfUrl = (url: string | undefined, cacheBuster?: number): string => {
  if (!url) return '';

  let fullUrl = url;
  if (!url.startsWith('http')) {
    // Use same logic as api.ts for API URL
    let baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) {
      baseUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';
    }
    fullUrl = `${baseUrl}${url}`;
  }

  // Add cache-busting parameter to force browser refresh
  const separator = fullUrl.includes('?') ? '&' : '?';
  return `${fullUrl}${separator}t=${cacheBuster || Date.now()}`;
};

interface JobSheetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  onNavigateToService?: () => void;
}

const FORMAT_OPTIONS: { value: JobSheetFormat; label: string; description: string }[] = [
  { value: 'A4', label: 'A4 - Full page', description: 'Full page' },
  { value: 'A5', label: 'A5 - Half page', description: 'Half page' },
  { value: 'thermal', label: 'Thermal (80mm)', description: '80mm receipt' },
];

const COPY_TYPE_OPTIONS: { value: JobSheetCopyType; label: string; description: string }[] = [
  { value: 'customer', label: 'Customer Copy', description: 'With company header' },
  { value: 'office', label: 'Office Copy', description: 'Without company header' },
];

export function JobSheetPreviewModal({
  isOpen,
  onClose,
  serviceId,
  onNavigateToService,
}: JobSheetPreviewModalProps) {
  const [jobSheet, setJobSheet] = useState<JobSheet | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<JobSheetFormat>('A4');
  const [selectedCopyType, setSelectedCopyType] = useState<JobSheetCopyType>('customer');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [pdfVersion, setPdfVersion] = useState<number>(Date.now()); // Cache-busting version

  // Fetch existing job sheet by serviceId when modal opens
  const { data: existingJobSheet, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['jobSheet-by-service', serviceId],
    queryFn: () => jobSheetApi.getByServiceId(serviceId),
    enabled: isOpen && !hasChecked,
    retry: false,
  });

  // Set job sheet from existing data or trigger generation
  useEffect(() => {
    if (isOpen && !isLoadingExisting && !hasChecked) {
      setHasChecked(true);
      if (existingJobSheet) {
        setJobSheet(existingJobSheet);
      }
    }
  }, [isOpen, isLoadingExisting, existingJobSheet, hasChecked]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasChecked(false);
      setJobSheet(null);
      setIframeError(false);
    }
  }, [isOpen]);

  const generateMutation = useMutation({
    mutationFn: ({ format, copyType }: { format: JobSheetFormat; copyType: JobSheetCopyType }) =>
      jobSheetApi.generateFromService(serviceId, undefined, format, copyType),
    onSuccess: (data) => {
      setJobSheet(data);
      setIsRegenerating(false);
      setIframeError(false);
      setPdfVersion(Date.now()); // Force iframe refresh with new version
    },
    onError: () => {
      toast.error('Failed to generate job sheet');
      setIsRegenerating(false);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: ({ format, copyType }: { format: JobSheetFormat; copyType: JobSheetCopyType }) => {
      if (!jobSheet?.id) throw new Error('No job sheet to regenerate');
      return jobSheetApi.regeneratePDF(jobSheet.id, format, copyType);
    },
    onSuccess: (data) => {
      setJobSheet(data);
      setIsRegenerating(false);
      setIframeError(false);
      setPdfVersion(Date.now()); // Force iframe refresh with new version
      const copyLabel = COPY_TYPE_OPTIONS.find(o => o.value === selectedCopyType)?.label || selectedCopyType;
      toast.success(`Job sheet regenerated: ${selectedFormat} - ${copyLabel}`);
    },
    onError: () => {
      toast.error('Failed to regenerate job sheet');
      setIsRegenerating(false);
    },
  });

  // Auto-generate if no existing job sheet found after check
  useEffect(() => {
    if (isOpen && hasChecked && !jobSheet && !generateMutation.isPending) {
      generateMutation.mutate({ format: selectedFormat, copyType: selectedCopyType });
    }
  }, [isOpen, hasChecked, jobSheet]);

  const handleFormatChange = (format: JobSheetFormat) => {
    if (format === selectedFormat) return;
    setSelectedFormat(format);
    setIsRegenerating(true);
    setIframeError(false); // Reset error on format change

    if (jobSheet?.id) {
      regenerateMutation.mutate({ format, copyType: selectedCopyType });
    } else {
      generateMutation.mutate({ format, copyType: selectedCopyType });
    }
  };

  const handleCopyTypeChange = (copyType: JobSheetCopyType) => {
    if (copyType === selectedCopyType) return;
    setSelectedCopyType(copyType);
    setIsRegenerating(true);
    setIframeError(false); // Reset error on copy type change

    if (jobSheet?.id) {
      regenerateMutation.mutate({ format: selectedFormat, copyType });
    } else {
      generateMutation.mutate({ format: selectedFormat, copyType });
    }
  };

  const handlePrint = () => {
    if (jobSheet?.pdfUrl) {
      // Open PDF in new window/tab for printing
      window.open(getPdfUrl(jobSheet.pdfUrl, pdfVersion), '_blank');
    }
  };

  const handleDownload = () => {
    if (jobSheet?.pdfUrl) {
      // Open PDF in new window/tab for download
      window.open(getPdfUrl(jobSheet.pdfUrl, pdfVersion), '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    if (jobSheet?.pdfUrl) {
      window.open(getPdfUrl(jobSheet.pdfUrl, pdfVersion), '_blank');
    }
  };

  const handleWhatsAppShare = () => {
    if (jobSheet) {
      const pdfLink = getPdfUrl(jobSheet.pdfUrl, pdfVersion);
      const message = `Job Sheet: ${jobSheet.jobSheetNumber}\nTicket: ${jobSheet.service?.ticketNumber || ''}\nDevice: ${jobSheet.service?.deviceModel || ''}\n\nView/Download: ${pdfLink}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleRetry = () => {
    generateMutation.mutate({ format: selectedFormat, copyType: selectedCopyType });
  };

  if (!isOpen) return null;

  const isLoading = generateMutation.isPending || isRegenerating || isLoadingExisting;

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
              <Printer className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Job Sheet Preview</h2>
              {jobSheet && (
                <p className="text-sm text-gray-500">
                  Job Sheet: <span className="font-medium">{jobSheet.jobSheetNumber}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Format & Copy Type Selector - Dropdowns */}
        <div className="px-6 py-3 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Paper Size Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="paper-format" className="text-sm font-medium text-gray-700 min-w-[50px]">
                Paper:
              </label>
              <select
                id="paper-format"
                value={selectedFormat}
                onChange={(e) => handleFormatChange(e.target.value as JobSheetFormat)}
                disabled={isLoading}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Copy Type Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="copy-type" className="text-sm font-medium text-gray-700 min-w-[70px]">
                Copy Type:
              </label>
              <select
                id="copy-type"
                value={selectedCopyType}
                onChange={(e) => handleCopyTypeChange(e.target.value as JobSheetCopyType)}
                disabled={isLoading}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
              >
                {COPY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Regenerate indicator */}
            {isRegenerating && (
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Regenerating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm">
                {isRegenerating ? `Generating ${selectedFormat} format...` : 'Generating Job Sheet...'}
              </p>
            </div>
          ) : generateMutation.isError ? (
            <div className="h-96 flex flex-col items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-4">Failed to generate job sheet</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : jobSheet?.pdfUrl ? (
            <div className="h-full flex flex-col items-center justify-center">
              {iframeError ? (
                /* Fallback UI when iframe fails to load */
                <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 w-full max-w-md">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Job Sheet Ready!</p>
                  <p className="text-sm text-gray-500 mb-1">#{jobSheet.jobSheetNumber}</p>
                  <p className="text-xs text-gray-400 mb-6">
                    {FORMAT_OPTIONS.find(f => f.value === selectedFormat)?.label} • {COPY_TYPE_OPTIONS.find(c => c.value === selectedCopyType)?.label}
                  </p>
                  <p className="text-xs text-gray-400 mb-4 text-center">
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
                /* PDF Preview using iframe - different sizes based on format */
                <iframe
                  key={pdfVersion} // Force re-render when PDF changes
                  src={getPdfUrl(jobSheet.pdfUrl, pdfVersion)}
                  title={`Job Sheet ${jobSheet.jobSheetNumber}`}
                  onError={() => setIframeError(true)}
                  onLoad={(e) => {
                    // Check if iframe loaded successfully (some browsers don't trigger onError for PDF)
                    try {
                      const iframe = e.target as HTMLIFrameElement;
                      // If we can't access contentDocument due to CORS, it might still be loaded
                      // Only set error if iframe is completely empty
                      if (iframe.contentDocument?.body?.innerHTML === '') {
                        setIframeError(true);
                      }
                    } catch {
                      // CORS error means content loaded from different origin - this is OK
                    }
                  }}
                  className={`border border-gray-200 rounded-lg ${
                    selectedFormat === 'thermal'
                      ? 'w-[280px] h-[500px]'
                      : selectedFormat === 'A5'
                        ? 'w-[420px] h-[500px]'
                        : 'w-full h-[500px]'
                  }`}
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
                Generate Job Sheet
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={!jobSheet?.pdfUrl || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium">Print</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!jobSheet?.pdfUrl || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Download</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              disabled={!jobSheet?.pdfUrl || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">WhatsApp</span>
            </button>
          </div>
          {onNavigateToService ? (
            <button
              onClick={onNavigateToService}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span className="text-sm font-medium">Go to Service</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <span className="text-sm font-medium">Close</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
