import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface MultiImageUploadProps {
  images: File[];
  previews: string[];
  onChange: (files: File[], previews: string[]) => void;
  maxImages?: number;
  accept?: string;
  className?: string;
}

export function MultiImageUpload({
  images,
  previews,
  onChange,
  maxImages = 5,
  accept = 'image/*',
  className = '',
}: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newFiles = [...images, ...files];
    const newPreviews = [...previews];

    let loadedCount = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        loadedCount++;
        if (loadedCount === files.length) {
          onChange(newFiles, newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });

    // If no new files, just update
    if (files.length === 0) {
      onChange(newFiles, newPreviews);
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onChange(newFiles, newPreviews);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {/* Previews */}
        {previews.map((preview, index) => (
          <div key={index} className="relative group">
            <img
              src={preview}
              alt={`Preview ${index + 1}`}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Upload Button */}
        {images.length < maxImages && (
          <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
            <Camera className="h-5 w-5 text-gray-400" />
            <span className="text-[10px] text-gray-500 mt-0.5">Add</span>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              multiple
              onChange={handleSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      {images.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {images.length}/{maxImages} images
        </p>
      )}
    </div>
  );
}
