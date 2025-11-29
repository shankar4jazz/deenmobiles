import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { CustomerDeviceFormData, ItemBrand, ItemModel, DeviceCondition } from '../../../types';
import { masterDataApi } from '../../../services/masterDataApi';
import { customerDeviceApi } from '../../../services/customerDeviceApi';
import { toast } from 'sonner';

const deviceFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  brandId: z.string().min(1, 'Please select a brand'),
  modelId: z.string().min(1, 'Please select a model'),
  imei: z.string()
    .regex(/^\d{15}$/, 'IMEI must be exactly 15 digits')
    .optional()
    .or(z.literal('')),
  color: z.string().optional(),
  password: z.string().optional(),
  pattern: z.string().optional(),
  conditionId: z.string().optional(),
  accessories: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceFormSchema>;

interface DeviceFormProps {
  customerId: string;
  onSuccess: (device: any) => void;
  onCancel: () => void;
}

const ACCESSORY_OPTIONS = ['Charger', 'Case/Cover', 'Screen Protector', 'Earphones'];

export const DeviceForm: React.FC<DeviceFormProps> = ({ customerId, onSuccess, onCancel }) => {
  const [brands, setBrands] = useState<ItemBrand[]>([]);
  const [models, setModels] = useState<ItemModel[]>([]);
  const [conditions, setConditions] = useState<DeviceCondition[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMasterData, setLoadingMasterData] = useState(true);
  const isMountedRef = useRef(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      customerId,
      brandId: '',
      modelId: '',
      imei: '',
      color: '',
      password: '',
      pattern: '',
      conditionId: '',
      accessories: [],
      notes: '',
    },
  });

  const selectedBrandId = watch('brandId');
  const selectedAccessories = watch('accessories') || [];

  useEffect(() => {
    isMountedRef.current = true;
    loadMasterData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      const [brandsRes, conditionsRes] = await Promise.all([
        masterDataApi.getAllBrands({ limit: 100, isActive: true }),
        masterDataApi.getAllDeviceConditions({ limit: 100, isActive: true }),
      ]);
      if (isMountedRef.current) {
        setBrands(brandsRes.data);
        setConditions(conditionsRes.data);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        toast.error('Failed to load master data');
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
        isActive: true
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

  const toggleAccessory = (accessory: string) => {
    const current = selectedAccessories;
    if (current.includes(accessory)) {
      setValue('accessories', current.filter((a) => a !== accessory));
    } else {
      setValue('accessories', [...current, accessory]);
    }
  };

  const onSubmit = async (data: DeviceFormData) => {
    try {
      setLoading(true);

      const device = await customerDeviceApi.createDevice(data);
      toast.success('Device added successfully');
      onSuccess(device);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add device');
    } finally {
      setLoading(false);
    }
  };

  if (loadingMasterData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Add New Device</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand <span className="text-red-500">*</span>
            </label>
            <select
              {...register('brandId')}
              className={`w-full px-3 py-2 border rounded-md text-sm ${
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
              className={`w-full px-3 py-2 border rounded-md text-sm ${
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
              className={`w-full px-3 py-2 border rounded-md text-sm ${
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
              placeholder="e.g., Black, White"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Password</label>
            <input
              {...register('password')}
              type="text"
              placeholder="PIN/Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select
              {...register('conditionId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select Condition</option>
              {conditions.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Pattern</label>
            <input
              {...register('pattern')}
              type="text"
              placeholder="e.g., Pattern lock sequence"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        {/* Accessories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accessories Included
          </label>
          <div className="flex flex-wrap gap-2">
            {ACCESSORY_OPTIONS.map((accessory) => (
              <button
                key={accessory}
                type="button"
                onClick={() => toggleAccessory(accessory)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedAccessories.includes(accessory)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {accessory}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="Any additional notes about the device..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? 'Adding...' : 'Add Device'}
          </button>
        </div>
      </div>
    </div>
  );
};
