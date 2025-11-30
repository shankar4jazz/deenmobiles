import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceIssueApi } from '@/services/masterDataApi';
import { ServiceIssue } from '@/types/masters';
import { Search, X, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface IssueTagInputProps {
  value: string[];
  onChange: (ids: string[], issues: ServiceIssue[]) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function IssueTagInput({
  value = [],
  onChange,
  disabled = false,
  error,
  placeholder = 'Type to search or add issues...',
  className = '',
}: IssueTagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<ServiceIssue[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch issues with search
  const { data, isLoading } = useQuery({
    queryKey: ['service-issues-search', searchTerm],
    queryFn: () => serviceIssueApi.getAll({ search: searchTerm, isActive: true, limit: 50 }),
    enabled: searchTerm.length >= 1,
  });

  // Fetch all issues for displaying selected tags
  const { data: allIssuesData } = useQuery({
    queryKey: ['service-issues-all'],
    queryFn: () => serviceIssueApi.getAll({ isActive: true, limit: 200 }),
  });

  const issues = data?.data || [];
  const allIssues = allIssuesData?.data || [];

  // Filter out already selected issues from suggestions
  const filteredIssues = issues.filter((issue) => !value.includes(issue.id));

  // Check if search term matches any existing issue
  const searchMatchesExisting = issues.some(
    (issue) => issue.name.toLowerCase() === searchTerm.toLowerCase()
  );

  // Create issue mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => serviceIssueApi.create({ name }),
    onSuccess: (newIssue) => {
      queryClient.invalidateQueries({ queryKey: ['service-issues-search'] });
      queryClient.invalidateQueries({ queryKey: ['service-issues-all'] });
      addIssue(newIssue);
      setSearchTerm('');
      toast.success(`Issue "${newIssue.name}" created`);
    },
    onError: () => {
      toast.error('Failed to create issue');
    },
  });

  // Update selected issues when value or allIssues change
  useEffect(() => {
    if (allIssues.length > 0) {
      const selected = allIssues.filter((issue) => value.includes(issue.id));
      setSelectedIssues(selected);
    }
  }, [value, allIssues]);

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

  const addIssue = useCallback(
    (issue: ServiceIssue) => {
      if (!value.includes(issue.id)) {
        const newIds = [...value, issue.id];
        const newIssues = [...selectedIssues, issue];
        onChange(newIds, newIssues);
      }
      setSearchTerm('');
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [value, selectedIssues, onChange]
  );

  const removeIssue = useCallback(
    (issueId: string) => {
      const newIds = value.filter((id) => id !== issueId);
      const newIssues = selectedIssues.filter((issue) => issue.id !== issueId);
      onChange(newIds, newIssues);
    },
    [value, selectedIssues, onChange]
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
      const maxIndex = showAddOption ? filteredIssues.length : filteredIssues.length - 1;
      setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const maxIndex = showAddOption ? filteredIssues.length : filteredIssues.length - 1;
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredIssues.length) {
        addIssue(filteredIssues[highlightedIndex]);
      } else if (highlightedIndex === filteredIssues.length && showAddOption) {
        handleCreateIssue();
      } else if (searchTerm.trim() && !searchMatchesExisting && filteredIssues.length === 0) {
        handleCreateIssue();
      }
    }

    if (e.key === 'Backspace' && !searchTerm && selectedIssues.length > 0) {
      removeIssue(selectedIssues[selectedIssues.length - 1].id);
    }
  };

  const handleCreateIssue = () => {
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
      {/* Selected Issues Tags */}
      <div
        className={`w-full px-2 py-1.5 border rounded-lg bg-white min-h-[42px] flex flex-wrap items-center gap-1.5 transition-colors ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed border-gray-200'
            : 'cursor-text hover:border-gray-400 border-gray-300'
        } ${error ? 'border-red-500' : ''} ${isOpen ? 'ring-2 ring-purple-500 border-purple-500' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedIssues.map((issue) => (
          <span
            key={issue.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full"
          >
            <AlertTriangle className="w-3 h-3" />
            {issue.name}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeIssue(issue.id);
                }}
                className="ml-0.5 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
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
          placeholder={selectedIssues.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm py-0.5 disabled:cursor-not-allowed"
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {searchTerm.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">Type to search issues</div>
          ) : isLoading ? (
            <div className="p-3 text-center text-gray-500 text-sm">Searching...</div>
          ) : (
            <div className="max-h-52 overflow-y-auto">
              {filteredIssues.length === 0 && !showAddOption ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  {searchTerm.length < 2 ? 'Type at least 2 characters' : 'No issues found'}
                </div>
              ) : (
                <div className="py-1">
                  {/* Existing Issues */}
                  {filteredIssues.map((issue, index) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => addIssue(issue)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm flex items-center gap-2 ${
                        highlightedIndex === index ? 'bg-purple-50' : ''
                      }`}
                    >
                      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{issue.name}</span>
                    </button>
                  ))}

                  {/* Add New Option */}
                  {showAddOption && (
                    <button
                      type="button"
                      onClick={handleCreateIssue}
                      disabled={createMutation.isPending}
                      className={`w-full px-3 py-2 text-left hover:bg-purple-50 transition-colors text-sm flex items-center gap-2 border-t border-gray-100 ${
                        highlightedIndex === filteredIssues.length ? 'bg-purple-50' : ''
                      }`}
                    >
                      <Plus className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="text-purple-600 font-medium">
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
