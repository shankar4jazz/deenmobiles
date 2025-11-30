import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { masterDataApi } from '@/services/masterDataApi';
import { ServiceCategory } from '@/types/masters';
import { Search, ChevronDown, X, Wrench } from 'lucide-react';

interface SearchableServiceCategorySelectProps {
  value: string;
  onChange: (categoryId: string, category?: ServiceCategory) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function SearchableServiceCategorySelect({
  value,
  onChange,
  disabled = false,
  error,
  placeholder = 'Select service category...',
  className = '',
}: SearchableServiceCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => masterDataApi.getAllServiceCategories({ limit: 100, isActive: true }),
  });

  const categories = data?.data || [];

  const selectedCategory = categories.find((c) => c.id === value);

  const filteredCategories = categories.filter((category) => {
    const search = searchTerm.toLowerCase();
    return (
      category.name.toLowerCase().includes(search) ||
      category.code?.toLowerCase().includes(search) ||
      category.description?.toLowerCase().includes(search)
    );
  });

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

  const handleSelect = (category: ServiceCategory) => {
    onChange(category.id, category);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearchTerm('');
  };

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const formatPrice = (price: number | string | undefined) => {
    if (!price) return '';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₹${numPrice.toFixed(0)}`;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div
        onClick={handleOpen}
        className={`w-full px-3 py-2 border rounded-lg bg-white flex items-center justify-between transition-colors ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed border-gray-200'
            : 'cursor-pointer hover:border-gray-400 border-gray-300'
        } ${error ? 'border-red-500' : ''}`}
      >
        {selectedCategory ? (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Wrench className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="truncate">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {selectedCategory.name}
                </div>
                {selectedCategory.defaultPrice && (
                  <div className="text-xs text-green-600">
                    Default: {formatPrice(selectedCategory.defaultPrice)}
                  </div>
                )}
              </div>
            </div>
            {!disabled && (
              <button
                onClick={handleClear}
                className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                type="button"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-500 ml-2 flex-shrink-0 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-hidden">
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'No categories found' : 'No categories available'}
              </div>
            ) : (
              <div className="py-1">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelect(category)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                      value === category.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-gray-500 mt-0.5">{category.description}</div>
                          )}
                        </div>
                      </div>
                      {category.defaultPrice && (
                        <span className="text-xs font-medium text-green-600 flex-shrink-0">
                          {formatPrice(category.defaultPrice)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
