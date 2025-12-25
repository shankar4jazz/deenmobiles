import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Plus } from 'lucide-react';

interface SearchableSelectProps<T> {
  value: string;
  onChange: (id: string, item?: T) => void;
  items: T[];
  loading?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  displayValue?: (item: T) => string;
  displaySecondary?: (item: T) => string;
  filterFn?: (item: T, searchTerm: string) => boolean;
  onAddNew?: () => void;
  addNewLabel?: string;
  disabled?: boolean;
  error?: string;
  getItemId: (item: T) => string;
  className?: string;
}

export function SearchableSelect<T>({
  value,
  onChange,
  items,
  loading = false,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  displayValue,
  displaySecondary,
  filterFn,
  onAddNew,
  addNewLabel = 'Add New',
  disabled = false,
  error,
  getItemId,
  className = '',
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find((item) => getItemId(item) === value);

  const filteredItems = filterFn
    ? items.filter((item) => filterFn(item, searchTerm.toLowerCase()))
    : items;

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

  const handleSelect = (item: T) => {
    onChange(getItemId(item), item);
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

  const getDisplayValue = (item: T) => {
    if (displayValue) return displayValue(item);
    return String(item);
  };

  const getSecondaryValue = (item: T) => {
    if (displaySecondary) return displaySecondary(item);
    return null;
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
        {selectedItem ? (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="truncate">
              <div className="font-medium text-gray-900 text-sm truncate">
                {getDisplayValue(selectedItem)}
              </div>
              {getSecondaryValue(selectedItem) && (
                <div className="text-xs text-gray-500 truncate">
                  {getSecondaryValue(selectedItem)}
                </div>
              )}
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
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'No results found' : 'No items available'}
              </div>
            ) : (
              <div className="py-1">
                {filteredItems.map((item) => (
                  <button
                    key={getItemId(item)}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                      value === getItemId(item) ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{getDisplayValue(item)}</div>
                    {getSecondaryValue(item) && (
                      <div className="text-xs text-gray-500 mt-0.5">{getSecondaryValue(item)}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {onAddNew && (
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {addNewLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
