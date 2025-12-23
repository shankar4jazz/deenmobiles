import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { jobSheetApi, JobSheet } from '@/services/jobSheetApi';
import { X, Printer, Download, MessageCircle, ArrowRight, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface JobSheetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  onNavigateToService: () => void;
}

export function JobSheetPreviewModal({
  isOpen,
  onClose,
  serviceId,
  onNavigateToService,
}: JobSheetPreviewModalProps) {
  const [jobSheet, setJobSheet] = useState<JobSheet | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () => jobSheetApi.generateFromService(serviceId),
    onSuccess: (data) => {
      setJobSheet(data);
      setHasGenerated(true);
    },
    onError: () => {
      toast.error('Failed to generate job sheet');
    },
  });

  useEffect(() => {
    if (isOpen && serviceId && !hasGenerated) {
      generateMutation.mutate();
    }
  }, [isOpen, serviceId]);

  const handlePrint = () => {
    if (jobSheet?.pdfUrl) {
      window.open(jobSheet.pdfUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (jobSheet?.pdfUrl) {
      const link = document.createElement('a');
      link.href = jobSheet.pdfUrl;
      link.download = `JobSheet-${jobSheet.jobSheetNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleWhatsAppShare = () => {
    if (jobSheet) {
      const pdfLink = `${window.location.origin}${jobSheet.pdfUrl}`;
      const message = `Job Sheet: ${jobSheet.jobSheetNumber}\nTicket: ${jobSheet.service?.ticketNumber || ''}\nDevice: ${jobSheet.service?.deviceModel || ''}\n\nView/Download: ${pdfLink}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleRetry = () => {
    setHasGenerated(false);
    generateMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Service Created Successfully!</h2>
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

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          {generateMutation.isPending ? (
            <div className="h-96 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm">Generating Job Sheet...</p>
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
              {/* Try object tag for better PDF support */}
              <object
                data={jobSheet.pdfUrl}
                type="application/pdf"
                className="w-full h-[500px] border border-gray-200 rounded-lg"
              >
                {/* Fallback if PDF can't be embedded */}
                <div className="h-[500px] flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Job Sheet Ready!</p>
                  <p className="text-sm text-gray-500 mb-4">Job Sheet #{jobSheet.jobSheetNumber}</p>
                  <p className="text-xs text-gray-400 mb-6">PDF preview not supported in this browser</p>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Printer className="w-5 h-5" />
                    <span className="font-medium">Open PDF</span>
                  </button>
                </div>
              </object>
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
              disabled={!jobSheet?.pdfUrl}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium">Print</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!jobSheet?.pdfUrl}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Download</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              disabled={!jobSheet?.pdfUrl}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">WhatsApp</span>
            </button>
          </div>
          <button
            onClick={onNavigateToService}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="text-sm font-medium">Go to Service</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
