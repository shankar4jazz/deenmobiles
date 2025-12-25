import React, { useEffect, useState, useRef } from 'react';
import { Plus, Smartphone, Check } from 'lucide-react';
import { CustomerDevice } from '../../../types';
import { customerDeviceApi } from '../../../services/customerDeviceApi';
import { toast } from 'sonner';

interface DeviceSelectorProps {
  customerId: string | null;
  selectedDeviceId: string | null;
  onSelectDevice: (device: CustomerDevice | null) => void;
  onCreateNew: () => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  customerId,
  selectedDeviceId,
  onSelectDevice,
  onCreateNew,
}) => {
  const [devices, setDevices] = useState<CustomerDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (customerId) {
      loadDevices();
    } else {
      setDevices([]);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [customerId]);

  const loadDevices = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      const { devices } = await customerDeviceApi.getAllDevices(customerId, {
        isActive: true,
        limit: 50,
      });
      if (isMountedRef.current) {
        setDevices(devices);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        toast.error(error.response?.data?.message || 'Failed to load devices');
        setDevices([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  if (!customerId) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Select a customer first to view their devices</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Customer Devices {devices.length > 0 && `(${devices.length})`}
        </h3>
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add New Device
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed border-gray-300">
          <Smartphone className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">No devices found for this customer</p>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Device
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
          {devices.map((device) => (
            <button
              key={device.id}
              type="button"
              onClick={() => onSelectDevice(device)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                selectedDeviceId === device.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className={`h-4 w-4 flex-shrink-0 ${selectedDeviceId === device.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {device.brand?.name} {device.model?.name}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-xs text-gray-600">
                    {device.imei && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">IMEI:</span>
                        <span className="font-mono">{device.imei}</span>
                      </div>
                    )}
                    {device.color && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Color:</span>
                        <span>{device.color}</span>
                      </div>
                    )}
                    {device.condition && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Condition:</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          device.condition.code === 'EXC' ? 'bg-green-100 text-green-800' :
                          device.condition.code === 'GOD' ? 'bg-blue-100 text-blue-800' :
                          device.condition.code === 'FAR' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {device.condition.name}
                        </span>
                      </div>
                    )}
                    {device.accessories && device.accessories.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">With:</span>
                        <span>{device.accessories.join(', ')}</span>
                      </div>
                    )}
                    {device._count && device._count.services > 0 && (
                      <div className="text-gray-500 italic">
                        {device._count.services} previous service{device._count.services > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {selectedDeviceId === device.id && (
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
