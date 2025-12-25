import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '@/services/invoiceApi';
import { FileText, Download, AlertCircle, CheckCircle, Loader2, ExternalLink, Printer, Eye } from 'lucide-react';

interface InvoiceButtonProps {
  serviceId: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onSuccess?: (invoiceId: string) => void;
}

export default function InvoiceButton({
  serviceId,
  variant = 'primary',
  size = 'md',
  showLabel = true,
  onSuccess,
}: InvoiceButtonProps) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Check if invoice already exists
  const { data: existingInvoice, refetch } = useQuery({
    queryKey: ['invoice-by-service', serviceId],
    queryFn: () => invoiceApi.getByServiceId(serviceId),
    retry: false,
    staleTime: 0,
  });

  // Generate invoice mutation
  const generateMutation = useMutation({
    mutationFn: () => invoiceApi.generateFromService(serviceId),
    onSuccess: (invoice) => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      refetch();

      if (onSuccess) {
        onSuccess(invoice.id);
      } else {
        // Navigate to invoice detail page
        setTimeout(() => {
          navigate(`/branch/invoices/${invoice.id}`);
        }, 1500);
      }
    },
    onError: (error: any) => {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);

      // If invoice already exists, refetch to update UI
      if (error?.response?.status === 400) {
        refetch();
      }
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleViewInvoice = () => {
    if (existingInvoice) {
      navigate(`/branch/invoices/${existingInvoice.id}`);
    }
  };

  const handlePrintInvoice = () => {
    if (existingInvoice?.pdfUrl) {
      window.open(existingInvoice.pdfUrl, '_blank');
    }
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

  const isLoading = generateMutation.isPending;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={existingInvoice ? handleViewInvoice : handleGenerate}
        onContextMenu={(e) => {
          e.preventDefault();
          if (existingInvoice) {
            setShowDropdown(!showDropdown);
          }
        }}
        disabled={isLoading}
        className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : existingInvoice ? (
          <Eye className="w-4 h-4" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        {showLabel && (
          <span>
            {isLoading ? 'Generating...' : existingInvoice ? 'View Invoice' : 'Generate Invoice'}
          </span>
        )}
      </button>

      {/* Dropdown menu for existing invoice */}
      {showDropdown && existingInvoice && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <div className="py-1">
            <button
              onClick={() => {
                handleViewInvoice();
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Invoice
            </button>
            <button
              onClick={() => {
                handlePrintInvoice();
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print PDF
            </button>
          </div>
        </div>
      )}

      {/* Success message */}
      {showSuccess && (
        <div className="absolute top-full mt-2 right-0 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm whitespace-nowrap z-20 shadow-lg">
          <CheckCircle className="w-4 h-4" />
          <span>Invoice generated! Redirecting...</span>
        </div>
      )}

      {/* Error message */}
      {showError && (
        <div className="absolute top-full mt-2 right-0 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm whitespace-nowrap z-20 shadow-lg">
          <AlertCircle className="w-4 h-4" />
          <span>Failed to generate invoice</span>
        </div>
      )}
    </div>
  );
}
