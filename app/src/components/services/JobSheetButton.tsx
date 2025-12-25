import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { jobSheetApi } from '@/services/jobSheetApi';
import { Printer, Download, AlertCircle, CheckCircle, Loader2, FileText, X } from 'lucide-react';
import TemplateSelector from '../jobsheets/TemplateSelector';

interface JobSheetButtonProps {
  serviceId: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function JobSheetButton({
  serviceId,
  variant = 'secondary',
  size = 'md',
  showLabel = true,
}: JobSheetButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();

  // Check if job sheet exists for this service
  const { data: jobSheet, refetch } = useQuery({
    queryKey: ['jobSheet', serviceId],
    queryFn: () => jobSheetApi.getByServiceId(serviceId),
    retry: false,
    staleTime: 0,
  });

  // Generate job sheet mutation
  const generateMutation = useMutation({
    mutationFn: (templateId?: string) => jobSheetApi.generateFromService(serviceId, templateId),
    onSuccess: () => {
      setShowTemplateSelector(false);
      refetch();
    },
  });

  // Download PDF mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (jobSheet?.pdfUrl) {
        // Open PDF in new tab
        window.open(jobSheet.pdfUrl, '_blank');
      } else {
        // Generate and download
        const result = await jobSheetApi.downloadPDF(jobSheet!.id);
        window.open(result.pdfUrl, '_blank');
      }
    },
  });

  // Regenerate PDF mutation
  const regenerateMutation = useMutation({
    mutationFn: () => jobSheetApi.regeneratePDF(jobSheet!.id),
    onSuccess: () => {
      refetch();
    },
  });

  const handlePrint = () => {
    if (jobSheet) {
      downloadMutation.mutate();
    } else {
      // Show template selector for new job sheets
      setShowTemplateSelector(true);
    }
    setShowDropdown(false);
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate();
    setShowDropdown(false);
  };

  const handleGenerateWithTemplate = () => {
    generateMutation.mutate(selectedTemplateId);
  };

  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const isLoading = generateMutation.isPending || downloadMutation.isPending || regenerateMutation.isPending;

  return (
    <div className="relative">
      <button
        onClick={handlePrint}
        disabled={isLoading}
        className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        onContextMenu={(e) => {
          e.preventDefault();
          if (jobSheet) {
            setShowDropdown(!showDropdown);
          }
        }}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : jobSheet ? (
          <Printer className="w-4 h-4" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        {showLabel && (
          <span>
            {isLoading
              ? 'Processing...'
              : jobSheet
              ? 'Print Job Sheet'
              : 'Generate Job Sheet'}
          </span>
        )}
      </button>

      {/* Dropdown for existing job sheets */}
      {showDropdown && jobSheet && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={handlePrint}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={handleRegenerate}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Status messages */}
      {generateMutation.isSuccess && (
        <div className="absolute top-full mt-2 right-0 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm whitespace-nowrap z-20">
          <CheckCircle className="w-4 h-4" />
          Job sheet generated successfully
        </div>
      )}
      {generateMutation.isError && (
        <div className="absolute top-full mt-2 right-0 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm whitespace-nowrap z-20">
          <AlertCircle className="w-4 h-4" />
          Failed to generate job sheet
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Template</h3>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <TemplateSelector
                value={selectedTemplateId}
                onChange={setSelectedTemplateId}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateWithTemplate}
                disabled={generateMutation.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Job Sheet
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
