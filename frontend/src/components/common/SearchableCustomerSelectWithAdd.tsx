import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '@/services/customerApi';
import { Customer } from '@/types';
import { Search, ChevronDown, X, Plus, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface SearchableCustomerSelectWithAddProps {
  value: string;
  onChange: (customerId: string, customer?: Customer) => void;
  onAddNew?: (phoneNumber?: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function SearchableCustomerSelectWithAdd({
  value,
  onChange,
  onAddNew,
  disabled = false,
  error,
  placeholder = 'Select customer...',
  className = '',
  selectedCustomerOverride,
}: SearchableCustomerSelectWithAddProps & { selectedCustomerOverride?: Customer | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((state) => state.user);

  // Fetch recent 10 customers for default display (backend already orders by createdAt desc)
  const { data: recentCustomers, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['customers-recent', user?.activeBranch?.id],
    queryFn: () =>
      customerApi.getAllCustomers({
        limit: 10,
        branchId: user?.activeBranch?.id,
      }),
  });

  // Search customers when typing
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['customers-search', searchTerm, user?.activeBranch?.id],
    queryFn: () =>
      customerApi.getAllCustomers({
        search: searchTerm,
        limit: 50,
        branchId: user?.activeBranch?.id,
      }),
    enabled: searchTerm.length >= 2,
  });

  // Show search results when searching, otherwise show recent customers
  const customers = searchTerm.length >= 2
    ? (searchResults?.customers || [])
    : (recentCustomers?.customers || []);
  const isLoading = searchTerm.length >= 2 ? isLoadingSearch : isLoadingRecent;

  // Use override if provided (for newly created customers), otherwise find in fetched data
  const selectedCustomer = selectedCustomerOverride
    || recentCustomers?.customers?.find((c) => c.id === value)
    || searchResults?.customers?.find((c) => c.id === value);

  const isPhoneSearch = /^\d+$/.test(searchTerm);

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

  const handleSelect = (customer: Customer) => {
    onChange(customer.id, customer);
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

  const handleAddNew = () => {
    setIsOpen(false);
    const phoneNumber = isPhoneSearch && searchTerm.length === 10 ? searchTerm : undefined;
    onAddNew?.(phoneNumber);
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
        {selectedCustomer ? (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="truncate">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {selectedCustomer.name}
                </div>
                <div className="text-xs text-gray-500 truncate">{selectedCustomer.phone}</div>
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
                placeholder="Search by name or phone..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            {searchTerm.length > 0 && searchTerm.length < 2 && (
              <p className="text-xs text-gray-500 mt-1 px-1">Type at least 2 characters to search</p>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm.length >= 2 ? 'Searching...' : 'Loading...'}
              </div>
            ) : customers.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {searchTerm.length >= 2
                    ? isPhoneSearch && searchTerm.length === 10
                      ? `No customer found with phone: ${searchTerm}`
                      : 'No customers found'
                    : 'No recent customers'}
                </p>
                {onAddNew && searchTerm.length >= 2 && (
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    {isPhoneSearch && searchTerm.length === 10
                      ? `Create customer with ${searchTerm}`
                      : 'Create new customer'}
                  </button>
                )}
              </div>
            ) : (
              <div className="py-1">
                {searchTerm.length < 2 && (
                  <div className="px-3 py-1.5 text-xs text-gray-500 font-medium bg-gray-50">
                    Recent Customers
                  </div>
                )}
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelect(customer)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                      value === customer.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{customer.phone}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {onAddNew && (
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Customer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
