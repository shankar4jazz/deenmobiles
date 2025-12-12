import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { serviceApi, UpdateServiceData } from '@/services/serviceApi';
import { X, Loader2 } from 'lucide-react';
import { CustomerDevice, Customer } from '@/types';
import { Fault, Accessory } from '@/types/masters';

// Components
import { FormRow } from '@/components/common/FormRow';
import { SearchableDeviceSelect } from '@/components/common/SearchableDeviceSelect';
import { FaultTagInput } from '@/components/common/FaultTagInput';
import { SearchableDeviceConditionSelect } from '@/components/common/SearchableDeviceConditionSelect';
import { PatternLockInput } from '@/components/common/PatternLockInput';
import { AccessoryTagInput } from '@/components/common/AccessoryTagInput';

// Validation schema
const editServiceSchema = z.object({
  customerDeviceId: z.string().min(1, 'Please select a device'),
  faultIds: z.array(z.string()).min(1, 'Please select at least one fault'),
  deviceConditionId: z.string().optional(),
  devicePassword: z.string().optional(),
  devicePattern: z.string().optional(),
  accessoryIds: z.array(z.string()).optional(),
  intakeNotes: z.string().optional(),
  issue: z.string().min(1, 'Issue is required'),
  diagnosis: z.string().optional(),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  actualCost: z.number().min(0, 'Actual cost cannot be negative').optional(),
  advancePayment: z.number().min(0, 'Advance payment cannot be negative').optional(),
});

type EditServiceFormData = z.infer<typeof editServiceSchema>;

interface EditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
}

export default function EditServiceModal({
  isOpen,
  onClose,
  serviceId,
}: EditServiceModalProps) {
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<CustomerDevice | null>(null);
  const [selectedFaults, setSelectedFaults] = useState<Fault[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<Accessory[]>([]);

  // Fetch service details
  const { data: service, isLoading: isLoadingService } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => serviceApi.getServiceById(serviceId),
    enabled: isOpen && !!serviceId,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditServiceFormData>({
    resolver: zodResolver(editServiceSchema),
    defaultValues: {
      customerDeviceId: '',
      faultIds: [],
      deviceConditionId: '',
      devicePassword: '',
      devicePattern: '',
      accessoryIds: [],
      intakeNotes: '',
      issue: '',
      diagnosis: '',
      estimatedCost: 0,
      actualCost: 0,
      advancePayment: 0,
    },
  });

  // Populate form when service data loads
  useEffect(() => {
    if (service) {
      reset({
        customerDeviceId: service.customerDeviceId || '',
        faultIds: service.faults?.map((f) => f.faultId) || [],
        deviceConditionId: service.conditionId || '',
        devicePassword: service.devicePassword || '',
        devicePattern: service.devicePattern || '',
        accessoryIds: service.accessories?.map((a) => a.accessoryId) || [],
        intakeNotes: service.intakeNotes || '',
        issue: service.issue || '',
        diagnosis: service.diagnosis || '',
        estimatedCost: service.estimatedCost || 0,
        actualCost: service.actualCost || 0,
        advancePayment: service.advancePayment || 0,
      });

      // Set selected faults for display
      if (service.faults) {
        setSelectedFaults(service.faults.map((f) => f.fault as Fault));
      }

      // Set selected accessories for display
      if (service.accessories) {
        setSelectedAccessories(service.accessories.map((a) => a.accessory as Accessory));
      }
    }
  }, [service, reset]);

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: (data: UpdateServiceData) => serviceApi.updateService(serviceId, data),
    onSuccess: () => {
      toast.success('Service updated successfully');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update service');
    },
  });

  const handleDeviceChange = (id: string, device?: CustomerDevice) => {
    setValue('customerDeviceId', id);
    setSelectedDevice(device || null);
  };

  const handleFaultsChange = (ids: string[], faults: Fault[], totalPrice: number) => {
    setValue('faultIds', ids);
    setSelectedFaults(faults);
    // Auto-fill estimated cost from sum of fault prices
    if (totalPrice > 0) {
      setValue('estimatedCost', totalPrice);
    }
  };

  const handleConditionChange = (id: string) => {
    setValue('deviceConditionId', id);
  };

  const onSubmit = async (data: EditServiceFormData) => {
    const submitData: UpdateServiceData = {
      customerDeviceId: data.customerDeviceId,
      faultIds: data.faultIds,
      issue: data.issue,
      diagnosis: data.diagnosis || undefined,
      estimatedCost: data.estimatedCost || 0,
      actualCost: data.actualCost || undefined,
      advancePayment: data.advancePayment || 0,
      devicePassword: data.devicePassword || undefined,
      devicePattern: data.devicePattern || undefined,
      conditionId: data.deviceConditionId || undefined,
      intakeNotes: data.intakeNotes || undefined,
      accessoryIds: data.accessoryIds && data.accessoryIds.length > 0 ? data.accessoryIds : [],
    };

    updateServiceMutation.mutate(submitData);
  };

  if (!isOpen) return null;

  const customerId = service?.customerId;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Service</h2>
              {service && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {service.ticketNumber} - {service.customer?.name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoadingService ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : !service ? (
              <div className="text-center py-12 text-gray-500">
                Service not found
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Customer Info (Read-only) */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-500 mb-1">Customer</div>
                  <div className="font-medium text-gray-900">{service.customer?.name}</div>
                  <div className="text-sm text-gray-500">{service.customer?.phone}</div>
                </div>

                {/* Row 1: Device, Service Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormRow label="Device" required error={errors.customerDeviceId?.message}>
                    <SearchableDeviceSelect
                      value={watch('customerDeviceId')}
                      onChange={handleDeviceChange}
                      customerId={customerId || ''}
                      disabled={!customerId}
                      error={errors.customerDeviceId?.message}
                      placeholder="Select device..."
                    />
                  </FormRow>

                  <FormRow label="Fault(s)" required error={errors.faultIds?.message}>
                    <Controller
                      control={control}
                      name="faultIds"
                      render={({ field }) => (
                        <FaultTagInput
                          value={field.value}
                          onChange={handleFaultsChange}
                          error={errors.faultIds?.message}
                          placeholder="Select faults..."
                        />
                      )}
                    />
                  </FormRow>
                </div>

                {/* Row 2: Device Condition, Issue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormRow label="Device Condition">
                    <SearchableDeviceConditionSelect
                      value={watch('deviceConditionId') || ''}
                      onChange={handleConditionChange}
                      placeholder="Select condition..."
                    />
                  </FormRow>

                  <FormRow label="Issue" required error={errors.issue?.message}>
                    <Controller
                      control={control}
                      name="issue"
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={2}
                          placeholder="Describe the issue..."
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none ${
                            errors.issue ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      )}
                    />
                  </FormRow>
                </div>

                {/* Row 3: Password, Pattern, Accessories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormRow label="Password/PIN">
                    <Controller
                      control={control}
                      name="devicePassword"
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Device unlock code..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      )}
                    />
                  </FormRow>

                  <FormRow label="Pattern Lock">
                    <Controller
                      control={control}
                      name="devicePattern"
                      render={({ field }) => (
                        <PatternLockInput
                          value={field.value || ''}
                          onChange={field.onChange}
                          label=""
                          showPattern
                        />
                      )}
                    />
                  </FormRow>

                  <FormRow label="Accessories">
                    <Controller
                      control={control}
                      name="accessoryIds"
                      render={({ field }) => (
                        <AccessoryTagInput
                          value={field.value || []}
                          onChange={(ids, accessories) => {
                            field.onChange(ids);
                            setSelectedAccessories(accessories);
                          }}
                          placeholder="Select accessories..."
                        />
                      )}
                    />
                  </FormRow>
                </div>

                {/* Row 4: Intake Notes */}
                <FormRow label="Intake Notes">
                  <Controller
                    control={control}
                    name="intakeNotes"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={2}
                        placeholder="Notes about device condition at intake..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      />
                    )}
                  />
                </FormRow>

                {/* Row 5: Diagnosis */}
                <FormRow label="Diagnosis">
                  <Controller
                    control={control}
                    name="diagnosis"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={2}
                        placeholder="Technician diagnosis..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      />
                    )}
                  />
                </FormRow>

                {/* Row 6: Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormRow label="Estimated Cost" error={errors.estimatedCost?.message}>
                    <Controller
                      control={control}
                      name="estimatedCost"
                      render={({ field }) => (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            placeholder="0"
                            className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                              errors.estimatedCost ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                      )}
                    />
                  </FormRow>

                  <FormRow label="Actual Cost" error={errors.actualCost?.message}>
                    <Controller
                      control={control}
                      name="actualCost"
                      render={({ field }) => (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            placeholder="0"
                            className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                              errors.actualCost ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                      )}
                    />
                  </FormRow>

                  <FormRow label="Advance Payment" error={errors.advancePayment?.message}>
                    <Controller
                      control={control}
                      name="advancePayment"
                      render={({ field }) => (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            placeholder="0"
                            className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                              errors.advancePayment ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                      )}
                    />
                  </FormRow>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateServiceMutation.isPending}
                    className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-400"
                  >
                    {updateServiceMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
