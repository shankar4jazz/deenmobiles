import { useState } from 'react';
import { FileText } from 'lucide-react';
import { InvoicePreviewModal } from './InvoicePreviewModal';

interface InvoiceButtonProps {
  serviceId: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function InvoiceButton({
  serviceId,
  variant = 'primary',
  size = 'md',
  showLabel = true,
}: InvoiceButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const handleClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-lg font-medium transition-colors flex items-center gap-2`}
      >
        <FileText className="w-4 h-4" />
        {showLabel && <span>Invoice</span>}
      </button>

      {/* Invoice Preview Modal - fetches data on open */}
      <InvoicePreviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        serviceId={serviceId}
      />
    </>
  );
}
