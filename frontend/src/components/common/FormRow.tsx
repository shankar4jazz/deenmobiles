import React from 'react';

interface FormRowProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormRow: React.FC<FormRowProps> = ({
  label,
  required,
  error,
  children,
  className = '',
}) => (
  <div className={className}>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);
