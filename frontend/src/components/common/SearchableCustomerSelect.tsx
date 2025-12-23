import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '@/services/customerApi';
import { Search, ChevronDown, X } from 'lucide-react';

interface SearchableCustomerSelectProps {
  value: string;
  onChange: (customerId: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export default function SearchableCustomerSelect({
  value,
  onChange,
  required = false,
  placeholder = 'Search and select customer...',
  className = '',
}: SearchableCustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all customers
  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customerApi.getAllCustomers({ limit: 1000 }),
  });

  const customers = customersData?.customers || [];

  // Get selected customer
  const selectedCustomer = customers.find((c) => c.id === value);

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.phone.includes(search) ||
      customer.email?.toLowerCase().includes(search)
    );
  });

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

  const handleSelect = (customerId: string) => {
    onChange(customerId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected Value Display */}
      <div
        onClick={handleOpen}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 transition-colors flex items-center justify-between"
      >
        {selectedCustomer ? (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
              <div className="text-xs text-gray-500">{selectedCustomer.phone}</div>
            </div>
            <button
              onClick={handleClear}
              className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-500 ml-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  let val = e.target.value;
                  if (/^\d+$/.test(val)) {
                    if (val.startsWith('0')) val = val.substring(1);
                    if (val.length > 10) return;
                  }
                  setSearchTerm(val);
                }}
                placeholder="Search by name, phone, or email..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'No customers found' : 'No customers available'}
              </div>
            ) : (
              <div className="py-1">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelect(customer.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      value === customer.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                      <span>{customer.phone}</span>
                      {customer.email && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span>{customer.email}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}
    </div>
  );
}
