import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faultApi } from '@/services/masterDataApi';
import { Fault } from '@/types/masters';
import { X, Plus, Wrench } from 'lucide-react';
import { toast } from 'sonner';

interface FaultTagInputProps {
  value: string[];
  onChange: (ids: string[], faults: Fault[], totalPrice: number) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function FaultTagInput({
  value = [],
  onChange,
  disabled = false,
  error,
  placeholder = 'Type to search or add faults...',
  className = '',
}: FaultTagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaults, setSelectedFaults] = useState<Fault[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch frequent faults by default
  const { data: frequentFaultsData, isLoading: isLoadingFrequent } = useQuery({
    queryKey: ['faults-frequent'],
    queryFn: () => faultApi.getAll({ isActive: true, limit: 50 }),
  });

  // Fetch faults with search
  const { data: searchData, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['faults-search', searchTerm],
    queryFn: () => faultApi.getAll({ search: searchTerm, isActive: true, limit: 50 }),
    enabled: searchTerm.length >= 1,
  });

  // Show search results when searching, otherwise show frequent faults
  const faults = searchTerm.length >= 1 ? (searchData?.data || []) : (frequentFaultsData?.data || []);
  const isLoading = searchTerm.length >= 1 ? isLoadingSearch : isLoadingFrequent;
  const allFaults = frequentFaultsData?.data || [];

  // Filter out already selected faults from suggestions
  const filteredFaults = faults.filter((fault) => !value.includes(fault.id));

  // Check if search term matches any existing fault
  const searchMatchesExisting = faults.some(
    (fault) => fault.name.toLowerCase() === searchTerm.toLowerCase()
  );

  // Create fault mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => faultApi.create({ name, defaultPrice: 0 }),
    onSuccess: (newFault) => {
      queryClient.invalidateQueries({ queryKey: ['faults-search'] });
      queryClient.invalidateQueries({ queryKey: ['faults-frequent'] });
      addFault(newFault);
      setSearchTerm('');
      toast.success(`Fault "${newFault.name}" created`);
    },
    onError: () => {
      toast.error('Failed to create fault');
    },
  });

  // Calculate total price from selected faults
  const calculateTotalPrice = useCallback((faults: Fault[]): number => {
    return faults.reduce((sum, fault) => sum + Number(fault.defaultPrice || 0), 0);
  }, []);

  // Update selected faults when value or allFaults change
  useEffect(() => {
    if (allFaults.length > 0) {
      const selected = allFaults.filter((fault) => value.includes(fault.id));
      setSelectedFaults(selected);
    }
  }, [value, allFaults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const addFault = useCallback(
    (fault: Fault) => {
      if (!value.includes(fault.id)) {
        const newIds = [...value, fault.id];
        const newFaults = [...selectedFaults, fault];
        const totalPrice = calculateTotalPrice(newFaults);
        onChange(newIds, newFaults, totalPrice);
      }
      setSearchTerm('');
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [value, selectedFaults, onChange, calculateTotalPrice]
  );

  const removeFault = useCallback(
    (faultId: string) => {
      const newIds = value.filter((id) => id !== faultId);
      const newFaults = selectedFaults.filter((fault) => fault.id !== faultId);
      const totalPrice = calculateTotalPrice(newFaults);
      onChange(newIds, newFaults, totalPrice);
    },
    [value, selectedFaults, onChange, calculateTotalPrice]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const maxIndex = showAddOption ? filteredFaults.length : filteredFaults.length - 1;
      setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const maxIndex = showAddOption ? filteredFaults.length : filteredFaults.length - 1;
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredFaults.length) {
        addFault(filteredFaults[highlightedIndex]);
      } else if (highlightedIndex === filteredFaults.length && showAddOption) {
        handleCreateFault();
      } else if (searchTerm.trim() && !searchMatchesExisting && filteredFaults.length === 0) {
        handleCreateFault();
      }
    }

    if (e.key === 'Backspace' && !searchTerm && selectedFaults.length > 0) {
      removeFault(selectedFaults[selectedFaults.length - 1].id);
    }
  };

  const handleCreateFault = () => {
    if (searchTerm.trim() && !createMutation.isPending) {
      createMutation.mutate(searchTerm.trim());
    }
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const showAddOption = searchTerm.trim().length >= 2 && !searchMatchesExisting && !isLoading;

  // Format price for display
  const formatPrice = (price: number | string) => {
    const numPrice = Number(price) || 0;
    return numPrice > 0 ? `₹${numPrice.toLocaleString('en-IN')}` : '';
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected Faults Tags */}
      <div
        className={`w-full px-2 py-1.5 border rounded-lg bg-white min-h-[42px] flex flex-wrap items-center gap-1.5 transition-colors ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed border-gray-200'
            : 'cursor-text hover:border-gray-400 border-gray-300'
        } ${error ? 'border-red-500' : ''} ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedFaults.map((fault) => (
          <span
            key={fault.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
          >
            <Wrench className="w-3 h-3" />
            {fault.name}
            {Number(fault.defaultPrice) > 0 && (
              <span className="text-blue-600 ml-0.5">({formatPrice(fault.defaultPrice)})</span>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFault(fault.id);
                }}
                className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={selectedFaults.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm py-0.5 disabled:cursor-not-allowed"
        />
      </div>

      {/* Total Price Display */}
      {selectedFaults.length > 0 && (
        <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
          <span>Total estimated cost:</span>
          <span className="font-semibold text-blue-600">
            ₹{calculateTotalPrice(selectedFaults).toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              {searchTerm.length >= 1 ? 'Searching...' : 'Loading...'}
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto">
              {filteredFaults.length === 0 && !showAddOption ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  {searchTerm.length >= 1 ? 'No faults found' : 'No faults available'}
                </div>
              ) : (
                <div className="py-1">
                  {/* Header for default list */}
                  {searchTerm.length === 0 && filteredFaults.length > 0 && (
                    <div className="px-3 py-1.5 text-xs text-gray-500 font-medium bg-gray-50">
                      Available Faults
                    </div>
                  )}
                  {/* Existing Faults */}
                  {filteredFaults.map((fault, index) => (
                    <button
                      key={fault.id}
                      type="button"
                      onClick={() => addFault(fault)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm flex items-center justify-between ${
                        highlightedIndex === index ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{fault.name}</span>
                      </div>
                      {Number(fault.defaultPrice) > 0 && (
                        <span className="text-xs text-gray-500 font-medium">
                          {formatPrice(fault.defaultPrice)}
                        </span>
                      )}
                    </button>
                  ))}

                  {/* Add New Option */}
                  {showAddOption && (
                    <button
                      type="button"
                      onClick={handleCreateFault}
                      disabled={createMutation.isPending}
                      className={`w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors text-sm flex items-center gap-2 border-t border-gray-100 ${
                        highlightedIndex === filteredFaults.length ? 'bg-blue-50' : ''
                      }`}
                    >
                      <Plus className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-blue-600 font-medium">
                        {createMutation.isPending ? 'Creating...' : `Add "${searchTerm}"`}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
