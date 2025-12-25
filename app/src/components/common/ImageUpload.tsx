import { useRef, useState, useEffect } from 'react';
import { Upload, X, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ImageUploadProps {
  value?: File | string;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  error,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Set initial preview if value is a URL string
  useEffect(() => {
    if (typeof value === 'string' && value) {
      const imageUrl = value.startsWith('http')
        ? value
        : `${API_URL}${value}`;
      setPreview(imageUrl);
    } else if (!value) {
      // Clear preview if value is null/undefined
      setPreview(null);
    }
  }, [value]);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setPreview(null);
      onChange(null);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange(file);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
        disabled={disabled}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-4
          flex flex-col items-center justify-center
          transition-all duration-200 cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50'}
          ${error ? 'border-red-300' : ''}
          ${preview ? 'h-48' : 'h-32'}
        `}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="h-full w-auto object-contain rounded"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-2">
              {value && typeof value === 'string' ? (
                <User className="h-full w-full" />
              ) : (
                <Upload className="h-full w-full" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG, or WebP (max 2MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
