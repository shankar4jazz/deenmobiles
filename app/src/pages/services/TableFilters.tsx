import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Calendar, Tag } from 'lucide-react';
import { ServiceStatus } from '@/services/serviceApi';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, format } from 'date-fns';

interface Fault {
  id: string;
  name: string;
}

interface ServiceFilters {
  search: string;
  status: ServiceStatus | '';
  startDate: string;
  endDate: string;
  faultIds: string[];
}

interface TableFiltersProps {
  filters: ServiceFilters;
  onFiltersChange: (filters: Partial<ServiceFilters>) => void;
  faults: Fault[];
  hasActiveFilter: boolean;
  onClear: () => void;
}

const STATUS_LABELS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'Pending',
  [ServiceStatus.IN_PROGRESS]: 'In Progress',
  [ServiceStatus.WAITING_PARTS]: 'Waiting Parts',
  [ServiceStatus.READY]: 'Ready',
  [ServiceStatus.NOT_READY]: 'Not Ready',
};

type DatePreset = 'today' | 'yesterday' | 'thisMonth' | 'custom' | '';

export default function TableFilters({
  filters,
  onFiltersChange,
  faults,
  hasActiveFilter,
  onClear
}: TableFiltersProps) {
  const [showFaultDropdown, setShowFaultDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>('');
  const faultDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (faultDropdownRef.current && !faultDropdownRef.current.contains(event.target as Node)) {
        setShowFaultDropdown(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
    };

    if (showFaultDropdown || showDateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFaultDropdown, showDateDropdown]);

  const handleDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();

    if (preset === 'today') {
      onFiltersChange({
        startDate: format(startOfDay(today), 'yyyy-MM-dd'),
        endDate: format(endOfDay(today), 'yyyy-MM-dd'),
      });
    } else if (preset === 'yesterday') {
      const yesterday = subDays(today, 1);
      onFiltersChange({
        startDate: format(startOfDay(yesterday), 'yyyy-MM-dd'),
        endDate: format(endOfDay(yesterday), 'yyyy-MM-dd'),
      });
    } else if (preset === 'thisMonth') {
      onFiltersChange({
        startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
      });
    } else if (preset === '') {
      onFiltersChange({ startDate: '', endDate: '' });
    }

    if (preset !== 'custom') {
      setShowDateDropdown(false);
    }
  };

  const handleFaultToggle = (faultId: string) => {
    const newFaultIds = filters.faultIds.includes(faultId)
      ? filters.faultIds.filter(id => id !== faultId)
      : [...filters.faultIds, faultId];
    onFiltersChange({ faultIds: newFaultIds });
  };

  const getDateLabel = () => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'thisMonth') return 'This Month';
    if (filters.startDate || filters.endDate) return 'Custom';
    return 'Date';
  };

  const hasDateFilter = filters.startDate || filters.endDate;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search ticket, customer, device..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Status Dropdown */}
      <select
        value={filters.status}
        onChange={(e) => onFiltersChange({ status: e.target.value as ServiceStatus | '' })}
        className="py-1.5 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">All Status</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {/* Faults Dropdown */}
      <div className="relative" ref={faultDropdownRef}>
        <button
          onClick={() => setShowFaultDropdown(!showFaultDropdown)}
          className={`flex items-center gap-1.5 py-1.5 px-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors ${
            filters.faultIds.length > 0 ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
          }`}
        >
          <Tag className="w-4 h-4" />
          Faults
          {filters.faultIds.length > 0 && (
            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {filters.faultIds.length}
            </span>
          )}
          <ChevronDown className="w-3 h-3" />
        </button>
        {showFaultDropdown && (
          <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-2">
              {faults.map((fault) => (
                <label
                  key={fault.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.faultIds.includes(fault.id)}
                    onChange={() => handleFaultToggle(fault.id)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{fault.name}</span>
                </label>
              ))}
              {faults.length === 0 && (
                <p className="text-sm text-gray-500 px-3 py-2">No faults available</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Date Dropdown */}
      <div className="relative" ref={dateDropdownRef}>
        <button
          onClick={() => setShowDateDropdown(!showDateDropdown)}
          className={`flex items-center gap-1.5 py-1.5 px-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors ${
            hasDateFilter ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          {getDateLabel()}
          <ChevronDown className="w-3 h-3" />
        </button>
        {showDateDropdown && (
          <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleDatePreset('today')}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 ${
                  datePreset === 'today' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleDatePreset('yesterday')}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 ${
                  datePreset === 'yesterday' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => handleDatePreset('thisMonth')}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 ${
                  datePreset === 'thisMonth' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => handleDatePreset('')}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 ${
                  !hasDateFilter ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                }`}
              >
                All Time
              </button>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-3 py-1 text-xs text-gray-500 uppercase">Custom Range</div>
                <div className="px-3 py-2 space-y-2">
                  <div>
                    <label className="text-xs text-gray-600">From</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => {
                        onFiltersChange({ startDate: e.target.value });
                        setDatePreset('custom');
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">To</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => {
                        onFiltersChange({ endDate: e.target.value });
                        setDatePreset('custom');
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilter && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 py-1.5 px-3 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  );
}
