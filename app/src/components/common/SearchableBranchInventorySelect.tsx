import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, X, Package, AlertTriangle } from 'lucide-react';
import { branchInventoryApi } from '@/services/branchInventoryApi';
import { useAuthStore } from '@/store/authStore';

interface BranchInventoryItem {
  id: string;
  stockQuantity: number;
  item: {
    id: string;
    itemCode: string;
    itemName: string;
    description?: string;
    modelVariant?: string;
    purchasePrice?: number;
    salesPrice?: number;
    hsnCode?: string;
    itemCategory?: {
      id: string;
      name: string;
    };
    itemUnit?: {
      id: string;
      name: string;
    };
    itemGSTRate?: {
      id: string;
      name: string;
      rate: number;
    };
    taxType?: string;
  };
}

interface SearchableBranchInventorySelectProps {
  value: string;
  onChange: (branchInventoryId: string, item?: BranchInventoryItem) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  excludeIds?: string[];
}

export default function SearchableBranchInventorySelect({
  value,
  onChange,
  placeholder = 'Search inventory items...',
  disabled = false,
  error,
  className = '',
  excludeIds = [],
}: SearchableBranchInventorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((state) => state.user);
  const branchId = user?.activeBranch?.id;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch inventory items with search
  const { data, isLoading } = useQuery({
    queryKey: ['branch-inventory-search', branchId, debouncedSearch],
    queryFn: () =>
      branchInventoryApi.getAllBranchInventories({
        branchId,
        search: debouncedSearch || undefined,
        isActive: true,
        limit: 30,
      }),
    enabled: !!branchId && isOpen,
    staleTime: 30 * 1000,
  });

  // Filter out excluded items and get available items
  const items: BranchInventoryItem[] = (data?.inventories || []).filter(
    (inv: BranchInventoryItem) => !excludeIds.includes(inv.id)
  );

  // Find selected item
  const selectedItem = items.find((item) => item.id === value);

  // Close dropdown on outside click
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelect = (item: BranchInventoryItem) => {
    onChange(item.id, item);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearchTerm('');
  };

  const getStockColor = (qty: number) => {
    if (qty <= 0) return 'text-red-600 bg-red-50';
    if (qty <= 5) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
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
                {selectedItem.item.itemName}
              </div>
              <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                <span>{selectedItem.item.itemCode}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStockColor(selectedItem.stockQuantity)}`}>
                  Stock: {selectedItem.stockQuantity}
                </span>
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
          <span className="text-gray-400 text-sm flex items-center gap-2">
            <Package className="w-4 h-4" />
            {placeholder}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-500 ml-2 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or code..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Items List */}
          <div className="max-h-56 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                Searching...
              </div>
            ) : items.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'No items found' : 'No inventory items available'}
              </div>
            ) : (
              <div className="py-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    disabled={item.stockQuantity <= 0}
                    className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm border-b border-gray-50 last:border-b-0 ${
                      value === item.id ? 'bg-purple-50' : ''
                    } ${item.stockQuantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {item.item.itemName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="font-mono">{item.item.itemCode}</span>
                          {item.item.itemCategory && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                              {item.item.itemCategory.name}
                            </span>
                          )}
                          {item.item.hsnCode && (
                            <span className="text-gray-400">HSN: {item.item.hsnCode}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-gray-900">
                          ₹{(item.item.salesPrice || 0).toLocaleString()}
                        </div>
                        <div className={`text-xs px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${getStockColor(item.stockQuantity)}`}>
                          {item.stockQuantity <= 0 && <AlertTriangle className="w-3 h-3" />}
                          Stock: {item.stockQuantity}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
