import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { damageConditionApi } from '@/services/masterDataApi';
import { DamageCondition } from '@/types/masters';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

interface DamageConditionTagInputProps {
  value: string[];
  onChange: (ids: string[], damageConditions: DamageCondition[]) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function DamageConditionTagInput({
  value = [],
  onChange,
  disabled = false,
  error,
  placeholder = 'Type to search or add damage conditions...',
  className = '',
}: DamageConditionTagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<DamageCondition[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Debounce search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch frequent damage conditions by default with caching
  const { data: frequentConditionsData, isLoading: isLoadingFrequent } = useQuery({
    queryKey: ['damage-conditions-frequent'],
    queryFn: () => damageConditionApi.getAll({ isActive: true, limit: 50 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch damage conditions with search - cached per search term
  const { data: searchData, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['damage-conditions-search', debouncedSearchTerm],
    queryFn: () => damageConditionApi.getAll({ search: debouncedSearchTerm, isActive: true, limit: 50 }),
    enabled: debouncedSearchTerm.length >= 1,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });

  // Show search results when searching, otherwise show frequent conditions
  const conditions = debouncedSearchTerm.length >= 1 ? (searchData?.data || []) : (frequentConditionsData?.data || []);
  const isLoading = debouncedSearchTerm.length >= 1 ? isLoadingSearch : isLoadingFrequent;
  const allConditions = frequentConditionsData?.data || [];

  // Filter out already selected conditions from suggestions
  const filteredConditions = conditions.filter((condition) => !value.includes(condition.id));

  // Check if search term matches any existing condition
  const searchMatchesExisting = conditions.some(
    (condition) => condition.name.toLowerCase() === searchTerm.toLowerCase()
  );

  // Create damage condition mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => damageConditionApi.create({ name }),
    onSuccess: (newCondition) => {
      queryClient.invalidateQueries({ queryKey: ['damage-conditions-search'] });
      queryClient.invalidateQueries({ queryKey: ['damage-conditions-frequent'] });
      addCondition(newCondition);
      setSearchTerm('');
      toast.success(`Damage condition "${newCondition.name}" created`);
    },
    onError: () => {
      toast.error('Failed to create damage condition');
    },
  });

  // Update selected conditions when value or allConditions change
  useEffect(() => {
    if (allConditions.length > 0) {
      const selected = allConditions.filter((condition) => value.includes(condition.id));
      setSelectedConditions(selected);
    }
  }, [value, allConditions]);

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

  const addCondition = useCallback(
    (condition: DamageCondition) => {
      if (!value.includes(condition.id)) {
        const newIds = [...value, condition.id];
        const newConditions = [...selectedConditions, condition];
        onChange(newIds, newConditions);
      }
      setSearchTerm('');
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [value, selectedConditions, onChange]
  );

  const removeCondition = useCallback(
    (conditionId: string) => {
      const newIds = value.filter((id) => id !== conditionId);
      const newConditions = selectedConditions.filter((condition) => condition.id !== conditionId);
      onChange(newIds, newConditions);
    },
    [value, selectedConditions, onChange]
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
      const maxIndex = showAddOption ? filteredConditions.length : filteredConditions.length - 1;
      setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const maxIndex = showAddOption ? filteredConditions.length : filteredConditions.length - 1;
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredConditions.length) {
        addCondition(filteredConditions[highlightedIndex]);
      } else if (highlightedIndex === filteredConditions.length && showAddOption) {
        handleCreateCondition();
      } else if (searchTerm.trim() && !searchMatchesExisting && filteredConditions.length === 0) {
        handleCreateCondition();
      }
    }

    if (e.key === 'Backspace' && !searchTerm && selectedConditions.length > 0) {
      removeCondition(selectedConditions[selectedConditions.length - 1].id);
    }
  };

  const handleCreateCondition = () => {
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

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected Damage Conditions Tags */}
      <div
        className={`w-full px-2 py-1.5 border rounded-lg bg-white min-h-[42px] flex flex-wrap items-center gap-1.5 transition-colors ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed border-gray-200'
            : 'cursor-text hover:border-gray-400 border-gray-300'
        } ${error ? 'border-red-500' : ''} ${isOpen ? 'ring-2 ring-orange-500 border-orange-500' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedConditions.map((condition) => (
          <span
            key={condition.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full"
          >
            <AlertTriangle className="w-3 h-3" />
            {condition.name}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCondition(condition.id);
                }}
                className="ml-0.5 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
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
          placeholder={selectedConditions.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm py-0.5 disabled:cursor-not-allowed"
        />
      </div>

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
              {filteredConditions.length === 0 && !showAddOption ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  {searchTerm.length >= 1 ? 'No damage conditions found' : 'No damage conditions available'}
                </div>
              ) : (
                <div className="py-1">
                  {/* Header for default list */}
                  {searchTerm.length === 0 && filteredConditions.length > 0 && (
                    <div className="px-3 py-1.5 text-xs text-gray-500 font-medium bg-gray-50">
                      Common Damage Conditions
                    </div>
                  )}
                  {/* Existing Conditions */}
                  {filteredConditions.map((condition, index) => (
                    <button
                      key={condition.id}
                      type="button"
                      onClick={() => addCondition(condition)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm flex items-center gap-2 ${
                        highlightedIndex === index ? 'bg-orange-50' : ''
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{condition.name}</span>
                    </button>
                  ))}

                  {/* Add New Option */}
                  {showAddOption && (
                    <button
                      type="button"
                      onClick={handleCreateCondition}
                      disabled={createMutation.isPending}
                      className={`w-full px-3 py-2 text-left hover:bg-orange-50 transition-colors text-sm flex items-center gap-2 border-t border-gray-100 ${
                        highlightedIndex === filteredConditions.length ? 'bg-orange-50' : ''
                      }`}
                    >
                      <Plus className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <span className="text-orange-600 font-medium">
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
