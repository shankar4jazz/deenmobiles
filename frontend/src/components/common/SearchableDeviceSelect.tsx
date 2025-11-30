import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerDeviceApi } from '@/services/customerDeviceApi';
import { CustomerDevice } from '@/types';
import { Search, ChevronDown, X, Plus, Smartphone } from 'lucide-react';

interface SearchableDeviceSelectProps {
  value: string;
  onChange: (deviceId: string, device?: CustomerDevice) => void;
  customerId: string;
  onAddNew?: () => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function SearchableDeviceSelect({
  value,
  onChange,
  customerId,
  onAddNew,
  disabled = false,
  error,
  placeholder = 'Select device...',
  className = '',
}: SearchableDeviceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customer-devices', customerId],
    queryFn: () => customerDeviceApi.getAllDevices(customerId, { limit: 100, isActive: true }),
    enabled: !!customerId,
  });

  const devices = data?.devices || [];

  const selectedDevice = devices.find((d) => d.id === value);

  const filteredDevices = devices.filter((device) => {
    const search = searchTerm.toLowerCase();
    const brandName = device.brand?.name?.toLowerCase() || '';
    const modelName = device.model?.name?.toLowerCase() || '';
    const imei = device.imei?.toLowerCase() || '';
    const color = device.color?.toLowerCase() || '';
    return (
      brandName.includes(search) ||
      modelName.includes(search) ||
      imei.includes(search) ||
      color.includes(search)
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

  // Reset selection when customer changes
  useEffect(() => {
    if (value && customerId) {
      const deviceExists = devices.find((d) => d.id === value);
      if (!deviceExists && devices.length > 0) {
        onChange('', undefined);
      }
    }
  }, [customerId, devices, value, onChange]);

  const handleSelect = (device: CustomerDevice) => {
    onChange(device.id, device);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearchTerm('');
  };

  const handleOpen = () => {
    if (disabled || !customerId) return;
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const getDeviceDisplay = (device: CustomerDevice) => {
    return `${device.brand?.name || ''} ${device.model?.name || ''}`.trim() || 'Unknown Device';
  };

  const getDeviceSecondary = (device: CustomerDevice) => {
    const parts = [];
    if (device.imei) parts.push(`IMEI: ${device.imei}`);
    if (device.color) parts.push(device.color);
    return parts.join(' • ');
  };

  const isDisabled = disabled || !customerId;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div
        onClick={handleOpen}
        className={`w-full px-3 py-2 border rounded-lg bg-white flex items-center justify-between transition-colors ${
          isDisabled
            ? 'bg-gray-100 cursor-not-allowed border-gray-200'
            : 'cursor-pointer hover:border-gray-400 border-gray-300'
        } ${error ? 'border-red-500' : ''}`}
      >
        {selectedDevice ? (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="truncate">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {getDeviceDisplay(selectedDevice)}
                </div>
                {getDeviceSecondary(selectedDevice) && (
                  <div className="text-xs text-gray-500 truncate">
                    {getDeviceSecondary(selectedDevice)}
                  </div>
                )}
              </div>
            </div>
            {!isDisabled && (
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
          <span className="text-gray-400 text-sm">
            {!customerId ? 'Select customer first' : placeholder}
          </span>
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
                placeholder="Search by brand, model, IMEI..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Loading devices...</div>
            ) : filteredDevices.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'No devices found' : 'No devices for this customer'}
              </div>
            ) : (
              <div className="py-1">
                {filteredDevices.map((device) => (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => handleSelect(device)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                      value === device.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">{getDeviceDisplay(device)}</div>
                        {getDeviceSecondary(device) && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {getDeviceSecondary(device)}
                          </div>
                        )}
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
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Device
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
