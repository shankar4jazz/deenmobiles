import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Smartphone } from 'lucide-react';
import { ItemBrand, ItemModel } from '../../../types/masters';
import { masterDataApi } from '../../../services/masterDataApi';
import { customerDeviceApi } from '../../../services/customerDeviceApi';
import { toast } from 'sonner';

const deviceFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  brandId: z.string().min(1, 'Please select a brand'),
  modelId: z.string().min(1, 'Please select a model'),
  imei: z.string()
    .regex(/^\d{5,17}$/, 'IMEI must be between 5 and 17 digits')
    .optional()
    .or(z.literal('')),
  color: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceFormSchema>;

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess: (device: any) => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  customerId,
  onSuccess,
}) => {
  const [brands, setBrands] = useState<ItemBrand[]>([]);
  const [models, setModels] = useState<ItemModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMasterData, setLoadingMasterData] = useState(true);
  const isMountedRef = useRef(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      customerId,
      brandId: '',
      modelId: '',
      imei: '',
      color: '',
    },
  });

  const selectedBrandId = watch('brandId');

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      loadMasterData();
      setValue('customerId', customerId);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [isOpen, customerId, setValue]);

  useEffect(() => {
    if (selectedBrandId) {
      loadModels(selectedBrandId);
    } else {
      setModels([]);
      setValue('modelId', '');
    }
  }, [selectedBrandId, setValue]);

  const loadMasterData = async () => {
    try {
      setLoadingMasterData(true);
      const brandsRes = await masterDataApi.getAllBrands({ limit: 100, isActive: true });
      if (isMountedRef.current) {
        setBrands(brandsRes.data);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        toast.error('Failed to load brands');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingMasterData(false);
      }
    }
  };

  const loadModels = async (brandId: string) => {
    try {
      const { data } = await masterDataApi.getAllModels({
        brandId,
        limit: 100,
        isActive: true,
      });
      if (isMountedRef.current) {
        setModels(data);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        toast.error('Failed to load models');
      }
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: DeviceFormData) => {
    try {
      setLoading(true);
      const device = await customerDeviceApi.createDevice(data);
      toast.success('Device added successfully');
      reset();
      onSuccess(device);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add device');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add New Device</h2>
                <p className="text-sm text-gray-500">Register a device for this customer</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          {loadingMasterData ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-6 space-y-4">
                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('brandId')}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.brandId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  {errors.brandId && (
                    <p className="text-xs text-red-500 mt-1">{errors.brandId.message}</p>
                  )}
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('modelId')}
                    disabled={!selectedBrandId}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.modelId ? 'border-red-500' : 'border-gray-300'
                    } ${!selectedBrandId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Model</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  {errors.modelId && (
                    <p className="text-xs text-red-500 mt-1">{errors.modelId.message}</p>
                  )}
                </div>

                {/* IMEI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
                  <input
                    {...register('imei')}
                    type="text"
                    maxLength={15}
                    placeholder="15 digits (optional)"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.imei ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.imei && (
                    <p className="text-xs text-red-500 mt-1">{errors.imei.message}</p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    {...register('color')}
                    type="text"
                    placeholder="e.g., Black, White, Gold"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || loadingMasterData}
                  className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Device'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
