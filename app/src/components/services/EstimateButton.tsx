import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { estimateApi } from '@/services/estimateApi';
import { FileText, Eye, Printer, Plus } from 'lucide-react';

interface EstimateButtonProps {
  serviceId: string;
  customerId?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onSuccess?: (estimateId: string) => void;
}

export default function EstimateButton({
  serviceId,
  customerId,
  variant = 'secondary',
  size = 'md',
  showLabel = true,
  onSuccess,
}: EstimateButtonProps) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Check if estimate already exists for this service
  const { data: estimates } = useQuery({
    queryKey: ['estimates-by-service', serviceId],
    queryFn: () => estimateApi.getAll({ serviceId, limit: 10 }),
    retry: false,
    staleTime: 0,
  });

  const existingEstimate = estimates?.data?.[0]; // Get the most recent estimate

  const handleCreateEstimate = () => {
    // Navigate to create estimate page with service pre-filled
    navigate(`/branch/estimates/create?serviceId=${serviceId}${customerId ? `&customerId=${customerId}` : ''}`);
  };

  const handleViewEstimate = () => {
    if (existingEstimate) {
      navigate(`/branch/estimates/${existingEstimate.id}`);
    }
  };

  const handlePrintEstimate = () => {
    if (existingEstimate?.pdfUrl) {
      window.open(existingEstimate.pdfUrl, '_blank');
    }
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={existingEstimate ? handleViewEstimate : handleCreateEstimate}
        onContextMenu={(e) => {
          e.preventDefault();
          if (existingEstimate) {
            setShowDropdown(!showDropdown);
          }
        }}
        className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-lg font-medium transition-colors flex items-center gap-2`}
      >
        {existingEstimate ? (
          <Eye className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {showLabel && (
          <span>
            {existingEstimate ? 'View Estimate' : 'Create Estimate'}
          </span>
        )}
      </button>

      {/* Dropdown menu for existing estimate */}
      {showDropdown && existingEstimate && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <div className="py-1">
            <button
              onClick={() => {
                handleViewEstimate();
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Estimate
            </button>
            {existingEstimate.pdfUrl && (
              <button
                onClick={() => {
                  handlePrintEstimate();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print PDF
              </button>
            )}
            <button
              onClick={() => {
                handleCreateEstimate();
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-200"
            >
              <Plus className="w-4 h-4" />
              Create New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
