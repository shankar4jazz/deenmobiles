import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { serviceApi, UpdateServiceData, ServiceStatus } from '@/services/serviceApi';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { CustomerDevice, Customer } from '@/types';
import { Fault, Accessory } from '@/types/masters';

// Components
import { FormRow } from '@/components/common/FormRow';
import { SearchableDeviceSelect } from '@/components/common/SearchableDeviceSelect';
import { FaultTagInput } from '@/components/common/FaultTagInput';
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
  damageCondition: z.string().min(1, 'Damage condition is required'),
  diagnosis: z.string().optional(),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  actualCost: z.number().min(0, 'Actual cost cannot be negative').optional(),
  advancePayment: z.number().min(0, 'Advance payment cannot be negative').optional(),
  status: z.nativeEnum(ServiceStatus),
  statusNotes: z.string().optional(),
  notServiceableReason: z.string().optional(),
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
      damageCondition: '',
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
        deviceConditionId: service.deviceCondition || '',
        devicePassword: service.devicePassword || '',
        devicePattern: service.devicePattern || '',
        accessoryIds: service.accessories?.map((a) => a.accessoryId) || [],
        intakeNotes: service.intakeNotes || '',
        damageCondition: service.damageCondition || '',
        diagnosis: service.diagnosis || '',
        estimatedCost: service.estimatedCost || 0,
        actualCost: service.actualCost || 0,
        advancePayment: service.advancePayment || 0,
        status: service.status,
        statusNotes: '',
        notServiceableReason: service.notServiceableReason || '',
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

  const onSubmit = async (data: EditServiceFormData) => {
    const submitData: UpdateServiceData = {
      customerDeviceId: data.customerDeviceId,
      faultIds: data.faultIds,
      damageCondition: data.damageCondition,
      diagnosis: data.diagnosis || undefined,
      estimatedCost: data.estimatedCost || 0,
      actualCost: data.actualCost || undefined,
      advancePayment: data.advancePayment || 0,
      devicePassword: data.devicePassword || undefined,
      devicePattern: data.devicePattern || undefined,
      deviceCondition: data.deviceConditionId || undefined,
      intakeNotes: data.intakeNotes || undefined,
      accessoryIds: data.accessoryIds && data.accessoryIds.length > 0 ? data.accessoryIds : [],
    };

    try {
      // Update main service details
      await updateServiceMutation.mutateAsync(submitData);

      // If status has changed, update status separately to trigger history/logic
      if (data.status !== service?.status) {
        await serviceApi.updateServiceStatus(
          serviceId,
          data.status,
          data.statusNotes || undefined,
          data.status === ServiceStatus.NOT_READY ? data.notServiceableReason : undefined
        );
      }

      toast.success('Service updated successfully');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update service');
    }
  };

  if (!isOpen) return null;

  const customerId = service?.customerId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header - Fixed at Top */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between z-10">
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

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingService ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : !service ? (
            <div className="text-center py-12 text-gray-500">
              Service not found
            </div>
          ) : (
            <form id="edit-service-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
              {/* Status Section */}
              <section className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-4">
                <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Service Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormRow label="Current Status" error={errors.status?.message} required>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        >
                          {Object.values(ServiceStatus).map((status) => (
                            <option key={status} value={status}>
                              {status.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </FormRow>

                  {watch('status') === ServiceStatus.NOT_READY && (
                    <FormRow label="Reason for Not Serviceable" error={errors.notServiceableReason?.message} required>
                      <Controller
                        name="notServiceableReason"
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            rows={2}
                            placeholder="Why can't this device be serviced?"
                            className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        )}
                      />
                    </FormRow>
                  )}
                </div>

                <FormRow label="Status Change Notes (Internal)" error={errors.statusNotes?.message}>
                  <Controller
                    name="statusNotes"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={2}
                        placeholder="Optional notes about this status change..."
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    )}
                  />
                </FormRow>
              </section>

              {/* Customer Info (Read-only Summary) */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                    <span className="text-lg font-bold">
                      {service.customer?.name?.[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{service.customer?.name}</div>
                    <div className="text-sm text-purple-600 font-medium">{service.customer?.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Current Status</div>
                  <div className="text-sm font-bold text-gray-700">{service.status}</div>
                </div>
              </div>

              {/* Section 1: Core Service Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Core Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormRow label="Device Model" required error={errors.customerDeviceId?.message}>
                    <SearchableDeviceSelect
                      value={watch('customerDeviceId')}
                      onChange={handleDeviceChange}
                      customerId={customerId || ''}
                      disabled={!customerId}
                      error={errors.customerDeviceId?.message}
                      placeholder="Select device..."
                    />
                  </FormRow>

                  <FormRow label="Fault(s) to Fix" required error={errors.faultIds?.message}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormRow label="Device Condition" required>
                    <Controller
                      control={control}
                      name="deviceConditionId"
                      render={({ field }) => (
                        <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
                          <button
                            type="button"
                            onClick={() => field.onChange('on')}
                            className={`px-6 py-1.5 text-sm font-semibold rounded-md transition-all ${field.value === 'on'
                              ? 'bg-white text-purple-600 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                              }`}
                          >
                            Powered On
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange('off')}
                            className={`px-6 py-1.5 text-sm font-semibold rounded-md transition-all ${field.value === 'off'
                              ? 'bg-white text-red-600 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                              }`}
                          >
                            Powered Off
                          </button>
                        </div>
                      )}
                    />
                  </FormRow>

                  <FormRow label="Physical Condition (Damage)" required error={errors.damageCondition?.message}>
                    <Controller
                      control={control}
                      name="damageCondition"
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={2}
                          placeholder="e.g. Broken screen, Scratches on back..."
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-shadow ${errors.damageCondition ? 'border-red-500' : 'border-gray-200'
                            }`}
                        />
                      )}
                    />
                  </FormRow>
                </div>
              </div>

              {/* Section 2: Security & Accessories */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Security & Accessories</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormRow label="PIN / Password">
                    <Controller
                      control={control}
                      name="devicePassword"
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Unlock code"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          placeholder="Charger, SIM Tray..."
                        />
                      )}
                    />
                  </FormRow>
                </div>
              </div>

              {/* Section 3: Technical Notes */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Technical Notes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormRow label="Intake Notes">
                    <Controller
                      control={control}
                      name="intakeNotes"
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={3}
                          placeholder="Initial observations..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      )}
                    />
                  </FormRow>

                  <FormRow label="Diagnosis">
                    <Controller
                      control={control}
                      name="diagnosis"
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={3}
                          placeholder="Detailed technician diagnosis..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      )}
                    />
                  </FormRow>
                </div>
              </div>

              {/* Section 4: Billing Details */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Billing Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormRow label="Estimated Total" error={errors.estimatedCost?.message}>
                    <Controller
                      control={control}
                      name="estimatedCost"
                      render={({ field }) => (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                          <input
                            type="number"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-purple-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    />
                  </FormRow>

                  <FormRow label="Actual Final Cost" error={errors.actualCost?.message}>
                    <Controller
                      control={control}
                      name="actualCost"
                      render={({ field }) => (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                          <input
                            type="number"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-green-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    />
                  </FormRow>

                  <FormRow label="Advance Received" error={errors.advancePayment?.message}>
                    <Controller
                      control={control}
                      name="advancePayment"
                      render={({ field }) => (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                          <input
                            type="number"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    />
                  </FormRow>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer - Fixed at Bottom */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            form="edit-service-form"
            type="submit"
            disabled={updateServiceMutation.isPending}
            className="px-8 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 shadow-lg shadow-purple-200 transition-all flex items-center gap-2"
          >
            {updateServiceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save All Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
