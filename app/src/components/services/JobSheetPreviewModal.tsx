import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobSheetApi, JobSheet } from '@/services/jobSheetApi';
import {
  X, Printer, Download, Eye, Loader2, RefreshCw, AlertCircle,
  CheckCircle2, ExternalLink, FileText, Maximize2, Minimize2, Calendar
} from 'lucide-react';
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

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface JobSheetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  onNavigateToService?: () => void;
}

export function JobSheetPreviewModal({
  isOpen,
  onClose,
  serviceId,
}: JobSheetPreviewModalProps) {
  const queryClient = useQueryClient();
  const [jobSheet, setJobSheet] = useState<JobSheet | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const [pdfVersion, setPdfVersion] = useState<number>(Date.now());
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch existing job sheet by serviceId when modal opens (GET - read only)
  const { data: existingJobSheet, isLoading: isLoadingExisting, isError: fetchError } = useQuery({
    queryKey: ['jobSheet-by-service', serviceId],
    queryFn: () => jobSheetApi.getByServiceId(serviceId),
    enabled: isOpen,
    retry: false,
    staleTime: 0,
  });

  // Generate NEW job sheet mutation (POST /services/:id/jobsheet)
  const generateMutation = useMutation({
    mutationFn: () => {
      setLoadingMessage('Generating Job Sheet...');
      return jobSheetApi.generateFromService(serviceId, undefined, 'A5-V2', 'customer');
    },
    onSuccess: (data) => {
      setJobSheet(data);
      setIframeError(false);
      setPdfVersion(Date.now());
      queryClient.invalidateQueries({ queryKey: ['jobSheet-by-service', serviceId] });
      toast.success('Job sheet generated successfully');
    },
    onError: () => {
      toast.error('Failed to generate job sheet');
    },
  });

  // Regenerate EXISTING job sheet mutation (POST /jobsheets/:id/regenerate)
  const regenerateMutation = useMutation({
    mutationFn: (jobSheetId: string) => {
      setLoadingMessage('Regenerating Job Sheet...');
      return jobSheetApi.regeneratePDF(jobSheetId, 'A5-V2', 'customer');
    },
    onSuccess: (data) => {
      setJobSheet(data);
      setIframeError(false);
      setPdfVersion(Date.now());
      queryClient.invalidateQueries({ queryKey: ['jobSheet-by-service', serviceId] });
      toast.success('Job sheet regenerated successfully');
    },
    onError: () => {
      toast.error('Failed to regenerate job sheet');
    },
  });

  // Handle job sheet loading/generation logic
  useEffect(() => {
    if (!isOpen) {
      setJobSheet(null);
      setIframeError(false);
      setIsFullscreen(false);
      return;
    }

    if (isLoadingExisting) {
      setLoadingMessage('Loading...');
      return;
    }

    if (existingJobSheet) {
      if (!regenerateMutation.isPending && !jobSheet) {
        regenerateMutation.mutate(existingJobSheet.id);
      }
    } else if (fetchError || !existingJobSheet) {
      if (!generateMutation.isPending && !jobSheet) {
        generateMutation.mutate();
      }
    }
  }, [isOpen, isLoadingExisting, existingJobSheet, fetchError]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  // Handle Print
  const handlePrint = () => {
    if (jobSheet?.pdfUrl) {
      const pdfWindow = window.open(getPdfUrl(jobSheet.pdfUrl, pdfVersion), '_blank');
      if (pdfWindow) {
        pdfWindow.onload = () => {
          setTimeout(() => pdfWindow.print(), 500);
        };
      }
    }
  };

  // Handle Download
  const handleDownload = async () => {
    if (jobSheet?.pdfUrl) {
      try {
        const pdfUrl = getPdfUrl(jobSheet.pdfUrl, pdfVersion);
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `JobSheet_${jobSheet.jobSheetNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('PDF downloaded successfully');
      } catch {
        window.open(getPdfUrl(jobSheet.pdfUrl, pdfVersion), '_blank');
      }
    }
  };

  // Handle Preview
  const handlePreview = () => {
    if (jobSheet?.pdfUrl) {
      window.open(getPdfUrl(jobSheet.pdfUrl, pdfVersion), '_blank');
    }
  };

  // Handle Regenerate
  const handleRegenerate = () => {
    if (jobSheet?.id) {
      regenerateMutation.mutate(jobSheet.id);
    } else if (existingJobSheet?.id) {
      regenerateMutation.mutate(existingJobSheet.id);
    } else {
      generateMutation.mutate();
    }
  };

  // Handle Retry
  const handleRetry = () => {
    if (existingJobSheet?.id) {
      regenerateMutation.mutate(existingJobSheet.id);
    } else {
      generateMutation.mutate();
    }
  };

  if (!isOpen) return null;

  const isLoading = isLoadingExisting || generateMutation.isPending || regenerateMutation.isPending;
  const hasError = generateMutation.isError || regenerateMutation.isError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isFullscreen && onClose()}
      />

      {/* Modal - Responsive sizing */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none'
            : 'w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white rounded-t-2xl">
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-start sm:items-center justify-between gap-4">
              {/* Left side - Title and info */}
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Job Sheet</h2>
                  {jobSheet && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-sm sm:text-base font-semibold text-purple-600">
                        {jobSheet.jobSheetNumber}
                      </span>
                      {jobSheet.service?.ticketNumber && (
                        <>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {jobSheet.service.ticketNumber}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {/* Format badge and date - visible on tablet and up */}
                  {jobSheet && (
                    <div className="hidden sm:flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        A5-V2 Format
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(jobSheet.generatedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Action buttons */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Regenerate Button */}
                {jobSheet && !isLoading && (
                  <button
                    onClick={handleRegenerate}
                    className="p-2 sm:p-2.5 hover:bg-purple-100 rounded-lg transition-colors text-gray-500 hover:text-purple-600"
                    title="Regenerate Job Sheet"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 sm:p-2.5 hover:bg-red-100 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile: Format badge and date */}
            {jobSheet && (
              <div className="flex sm:hidden items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  A5-V2
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(jobSheet.generatedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content - PDF Preview Area */}
        <div className={`flex-1 overflow-hidden bg-gray-100 ${isFullscreen ? 'p-2 sm:p-4' : 'p-3 sm:p-6'}`}>
          {isLoading ? (
            <div className="h-full min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-purple-600" />
                </div>
              </div>
              <p className="mt-4 text-sm sm:text-base font-semibold text-gray-700">{loadingMessage}</p>
              <p className="mt-1 text-xs sm:text-sm text-gray-400">Please wait while we prepare your document</p>
            </div>
          ) : hasError ? (
            <div className="h-full min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
              </div>
              <p className="mt-4 text-base sm:text-lg font-semibold text-red-600">Failed to generate job sheet</p>
              <p className="mt-1 text-sm text-gray-500">Something went wrong. Please try again.</p>
              <button
                onClick={handleRetry}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-lg shadow-purple-200"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </div>
          ) : jobSheet?.pdfUrl ? (
            <div className="h-full flex flex-col">
              {iframeError ? (
                /* Fallback UI when iframe fails */
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 p-6">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="mt-4 text-xl font-bold text-gray-900">Job Sheet Ready!</p>
                  <p className="mt-2 text-base text-gray-600 font-medium">#{jobSheet.jobSheetNumber}</p>
                  <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                    A5-V2 Format
                  </span>
                  <p className="mt-4 text-sm text-gray-400 text-center max-w-sm">
                    PDF preview is not available in this browser. Click below to open in a new tab.
                  </p>
                  <button
                    onClick={handlePreview}
                    className="mt-6 flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-lg shadow-purple-200"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open PDF in New Tab
                  </button>
                </div>
              ) : (
                /* PDF Preview iframe - Responsive height */
                <iframe
                  key={pdfVersion}
                  src={getPdfUrl(jobSheet.pdfUrl, pdfVersion)}
                  title={`Job Sheet ${jobSheet.jobSheetNumber}`}
                  onError={() => setIframeError(true)}
                  onLoad={(e) => {
                    try {
                      const iframe = e.target as HTMLIFrameElement;
                      if (iframe.contentDocument?.body?.innerHTML === '') {
                        setIframeError(true);
                      }
                    } catch {
                      // CORS error - OK
                    }
                  }}
                  className={`w-full bg-white rounded-xl border border-gray-200 shadow-inner ${
                    isFullscreen
                      ? 'h-full'
                      : 'h-[400px] sm:h-[500px] md:h-[550px] lg:h-[600px]'
                  }`}
                />
              )}
            </div>
          ) : (
            <div className="h-full min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="mt-4 text-base font-medium text-gray-600">No preview available</p>
              <button
                onClick={handleRetry}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Generate Job Sheet
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions - Responsive */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-1">
              {/* Preview Button */}
              <button
                onClick={handlePreview}
                disabled={!jobSheet?.pdfUrl || isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Eye className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Preview</span>
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                disabled={!jobSheet?.pdfUrl || isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-200"
              >
                <Printer className="w-5 h-5" />
                <span className="text-sm font-semibold">Print</span>
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={!jobSheet?.pdfUrl || isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm font-semibold">Download</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="order-1 sm:order-2 px-6 py-3 text-sm font-semibold text-gray-600 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
