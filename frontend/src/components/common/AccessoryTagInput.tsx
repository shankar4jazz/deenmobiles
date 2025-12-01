import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accessoryApi } from '@/services/masterDataApi';
import { Accessory } from '@/types/masters';
import { X, ChevronDown, Check, Package } from 'lucide-react';

interface AccessoryTagInputProps {
  value: string[];
  onChange: (ids: string[], accessories: Accessory[]) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function AccessoryTagInput({
  value = [],
  onChange,
  disabled = false,
  error,
  placeholder = 'Select accessories...',
  className = '',
  label,
}: AccessoryTagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccessories, setSelectedAccessories] = useState<Accessory[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all accessories
  const { data: accessoriesData, isLoading } = useQuery({
    queryKey: ['accessories', searchTerm],
    queryFn: () => accessoryApi.getAll({
      search: searchTerm || undefined,
      isActive: true,
      limit: 100
    }),
  });

  const accessories = accessoriesData?.data || [];

  // Filter out already selected accessories
  const filteredAccessories = accessories.filter((acc) => !value.includes(acc.id));

  // Update selected accessories when value or accessories change
  useEffect(() => {
    if (accessories.length > 0) {
      const allAccessories = accessoriesData?.data || [];
      const selected = allAccessories.filter((acc) => value.includes(acc.id));
      setSelectedAccessories(selected);
    }
  }, [value, accessoriesData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const addAccessory = useCallback((accessory: Accessory) => {
    if (!value.includes(accessory.id)) {
      const newIds = [...value, accessory.id];
      const newAccessories = [...selectedAccessories, accessory];
      setSelectedAccessories(newAccessories);
      onChange(newIds, newAccessories);
    }
    setSearchTerm('');
    inputRef.current?.focus();
  }, [value, selectedAccessories, onChange]);

  const removeAccessory = useCallback((accessoryId: string) => {
    const newIds = value.filter((id) => id !== accessoryId);
    const newAccessories = selectedAccessories.filter((acc) => acc.id !== accessoryId);
    setSelectedAccessories(newAccessories);
    onChange(newIds, newAccessories);
  }, [value, selectedAccessories, onChange]);

  const toggleAccessory = useCallback((accessory: Accessory) => {
    if (value.includes(accessory.id)) {
      removeAccessory(accessory.id);
    } else {
      addAccessory(accessory);
    }
  }, [value, addAccessory, removeAccessory]);

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        {/* Selected Tags + Input Container */}
        <div
          className={`
            min-h-[38px] p-1 border rounded-md bg-white transition-colors
            flex flex-wrap gap-1 items-center
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-text'}
            ${error ? 'border-red-500' : isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}
          `}
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              inputRef.current?.focus();
            }
          }}
        >
          {/* Selected Tags */}
          {selectedAccessories.map((accessory) => (
            <span
              key={accessory.id}
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm
                bg-blue-100 text-blue-800 border border-blue-200
                ${disabled ? 'opacity-75' : ''}
              `}
            >
              <Package className="h-3 w-3" />
              {accessory.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAccessory(accessory.id);
                  }}
                  className="hover:bg-blue-200 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            disabled={disabled}
            placeholder={selectedAccessories.length === 0 ? placeholder : ''}
            className={`
              flex-1 min-w-[120px] outline-none text-sm bg-transparent
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
          />

          {/* Dropdown Icon */}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                Loading accessories...
              </div>
            ) : accessories.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                No accessories found
              </div>
            ) : (
              <div className="py-1">
                {accessories.map((accessory) => {
                  const isSelected = value.includes(accessory.id);
                  return (
                    <button
                      key={accessory.id}
                      type="button"
                      onClick={() => toggleAccessory(accessory)}
                      className={`
                        w-full px-3 py-2 text-left text-sm flex items-center gap-2
                        ${isSelected
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      <div className={`
                        w-4 h-4 border rounded flex items-center justify-center
                        ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                      `}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="flex-1">{accessory.name}</span>
                      {accessory.code && (
                        <span className="text-xs text-gray-400">{accessory.code}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessory count */}
      {selectedAccessories.length > 0 && (
        <p className="text-xs text-gray-500">
          {selectedAccessories.length} accessory{selectedAccessories.length > 1 ? 'ies' : ''} selected
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
