import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { serviceApi, CreateServiceData } from '@/services/serviceApi';
import { masterDataApi } from '@/services/masterDataApi';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft } from 'lucide-react';
import { CustomerDevice, Customer } from '@/types';
import { Fault, DamageCondition, Accessory } from '@/types/masters';

// Components
import { FormRow } from '@/components/common/FormRow';
import { SearchableCustomerSelectWithAdd } from '@/components/common/SearchableCustomerSelectWithAdd';
import { SearchableDeviceSelect } from '@/components/common/SearchableDeviceSelect';
import { FaultTagInput } from '@/components/common/FaultTagInput';
import { MultiImageUpload } from '@/components/common/MultiImageUpload';
import { DamageConditionTagInput } from '@/components/common/DamageConditionTagInput';
import { PatternLockInput } from '@/components/common/PatternLockInput';
import { AccessoryTagInput } from '@/components/common/AccessoryTagInput';
import { AddDeviceModal } from './components/AddDeviceModal';
import AddCustomerModal from '@/components/branch/AddCustomerModal';

// Zod validation schema
const serviceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  customerDeviceId: z.string().min(1, 'Please select a device'),
  faultIds: z.array(z.string()).min(1, 'Please select at least one fault'),
  deviceConditionId: z.string().optional(),
  devicePassword: z.string().optional(),
  devicePattern: z.string().optional(),
  accessoryIds: z.array(z.string()).optional(),
  intakeNotes: z.string().optional(),
  damageConditionIds: z.array(z.string()).min(1, 'Please add at least one damage condition'),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  branchId: z.string().min(1, 'Branch ID is required'),
  dataWarrantyAccepted: z.boolean().default(false),
  sendNotificationOnAssign: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function CreateService() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Modal states
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [initialPhoneNumber, setInitialPhoneNumber] = useState<string>();

  // Image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Selected entities for display
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<CustomerDevice | null>(null);
  const [selectedFaults, setSelectedFaults] = useState<Fault[]>([]);
  const [selectedDamageConditions, setSelectedDamageConditions] = useState<DamageCondition[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<Accessory[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      customerId: '',
      customerDeviceId: '',
      faultIds: [],
      deviceConditionId: '',
      devicePassword: '',
      devicePattern: '',
      accessoryIds: [],
      intakeNotes: '',
      damageConditionIds: [],
      estimatedCost: 0,
      branchId: '',
      dataWarrantyAccepted: false,
      sendNotificationOnAssign: true,
    },
  });

  const customerId = watch('customerId');
  const estimatedCost = watch('estimatedCost');

  // Auto-set branch ID
  useEffect(() => {
    const branchId = user?.activeBranch?.id;
    if (branchId) {
      setValue('branchId', branchId);
    } else {
      toast.error('No branch found. Please log in again.');
      navigate('/login');
    }
  }, [user, setValue, navigate]);

  // Reset device when customer changes
  useEffect(() => {
    setSelectedDevice(null);
    setValue('customerDeviceId', '');
  }, [customerId, setValue]);

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: CreateServiceData) => serviceApi.createService(data),
    onSuccess: (response) => {
      toast.success('Service created successfully');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      navigate(`/branch/services/${response.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create service');
    },
  });

  const handleCustomerChange = (id: string, customer?: Customer) => {
    setValue('customerId', id);
    setSelectedCustomer(customer || null);
  };

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

  const handleAddCustomer = (phoneNumber?: string) => {
    setInitialPhoneNumber(phoneNumber);
    setShowAddCustomerModal(true);
  };

  const handleCustomerCreated = (customer: Customer) => {
    setValue('customerId', customer.id);
    setSelectedCustomer(customer);
    setShowAddCustomerModal(false);
    // Invalidate customer queries so the new customer appears in the dropdown
    queryClient.invalidateQueries({ queryKey: ['customers-recent'] });
    queryClient.invalidateQueries({ queryKey: ['customers-search'] });
    toast.success('Customer created and selected');
  };

  const handleDeviceCreated = (device: CustomerDevice) => {
    setValue('customerDeviceId', device.id);
    setSelectedDevice(device);
    setShowAddDeviceModal(false);
    queryClient.invalidateQueries({ queryKey: ['customer-devices', customerId] });
    toast.success('Device added and selected');
  };

  const handleImagesChange = (files: File[], previews: string[]) => {
    setSelectedImages(files);
    setImagePreviews(previews);
  };

  const onSubmit = async (data: ServiceFormData) => {
    // Combine damage condition names from selected conditions
    const damageConditionText = selectedDamageConditions.map((condition) => condition.name).join(', ');

    const submitData: CreateServiceData = {
      customerId: data.customerId,
      customerDeviceId: data.customerDeviceId,
      faultIds: data.faultIds,
      damageCondition: damageConditionText,
      damageConditionIds: data.damageConditionIds,
      estimatedCost: data.estimatedCost || 0,
      branchId: data.branchId,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      // Intake fields
      devicePassword: data.devicePassword || undefined,
      devicePattern: data.devicePattern || undefined,
      conditionId: data.deviceConditionId || undefined,
      intakeNotes: data.intakeNotes || undefined,
      accessoryIds: data.accessoryIds && data.accessoryIds.length > 0 ? data.accessoryIds : undefined,
      // New fields
      dataWarrantyAccepted: data.dataWarrantyAccepted,
      sendNotificationOnAssign: data.sendNotificationOnAssign,
    };

    createServiceMutation.mutate(submitData);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b sticky top-0 z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-12">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-base font-semibold text-gray-900">New Service</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          {/* Row 1: Customer, Device, Service Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2">
            <FormRow label="Customer" required error={errors.customerId?.message}>
              <SearchableCustomerSelectWithAdd
                value={customerId}
                onChange={handleCustomerChange}
                onAddNew={handleAddCustomer}
                error={errors.customerId?.message}
                placeholder="Search customer..."
                selectedCustomerOverride={selectedCustomer}
              />
            </FormRow>

            <FormRow label="Device" required error={errors.customerDeviceId?.message}>
              <SearchableDeviceSelect
                value={watch('customerDeviceId')}
                onChange={handleDeviceChange}
                customerId={customerId}
                onAddNew={() => setShowAddDeviceModal(true)}
                disabled={!customerId}
                error={errors.customerDeviceId?.message}
                placeholder={customerId ? 'Select device...' : 'Select customer first'}
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

          {/* Row 2: Device Condition, Damage Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2">
            <FormRow label="Device Condition">
              <Controller
                control={control}
                name="deviceConditionId"
                render={({ field }) => (
                  <div className="flex items-center gap-4 h-[38px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deviceCondition"
                        value="on"
                        checked={field.value === 'on'}
                        onChange={() => field.onChange('on')}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">On</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deviceCondition"
                        value="off"
                        checked={field.value === 'off'}
                        onChange={() => field.onChange('off')}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Off</span>
                    </label>
                  </div>
                )}
              />
            </FormRow>

            <FormRow label="Damage Condition" required error={errors.damageConditionIds?.message}>
              <Controller
                control={control}
                name="damageConditionIds"
                render={({ field }) => (
                  <DamageConditionTagInput
                    value={field.value}
                    onChange={(ids, conditions) => {
                      field.onChange(ids);
                      setSelectedDamageConditions(conditions);
                    }}
                    error={errors.damageConditionIds?.message}
                    placeholder="Type to search or add damage conditions..."
                  />
                )}
              />
            </FormRow>
          </div>

          {/* Row 3: Device Password, Pattern Lock, Accessories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2">
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

            <FormRow label="Accessories Included">
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
          <div className="grid grid-cols-1 gap-x-3 gap-y-2">
            <FormRow label="Intake Notes">
              <Controller
                control={control}
                name="intakeNotes"
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={2}
                    placeholder="Notes about device condition at intake (scratches, dents, etc.)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                )}
              />
            </FormRow>
          </div>

          {/* Row 5: Estimated Cost, Data Warranty, Notification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2">
            <FormRow label="Estimated Cost" error={errors.estimatedCost?.message}>
              <Controller
                control={control}
                name="estimatedCost"
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
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

            <FormRow label="Data Warranty">
              <Controller
                control={control}
                name="dataWarrantyAccepted"
                render={({ field }) => (
                  <label className="flex items-center gap-3 h-[38px] cursor-pointer">
                    <div
                      onClick={() => field.onChange(!field.value)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        field.value ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          field.value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                    <span className="text-sm text-gray-600">Customer accepts data loss risk</span>
                  </label>
                )}
              />
            </FormRow>

            <FormRow label="Notifications">
              <Controller
                control={control}
                name="sendNotificationOnAssign"
                render={({ field }) => (
                  <label className="flex items-center gap-3 h-[38px] cursor-pointer">
                    <div
                      onClick={() => field.onChange(!field.value)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        field.value ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          field.value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                    <span className="text-sm text-gray-600">Notify technician when assigned</span>
                  </label>
                )}
              />
            </FormRow>
          </div>

          {/* Row 6: Device Photos & Cost Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2">
            <div className="md:col-span-2">
              <FormRow label="Device Photos">
                <MultiImageUpload
                  images={selectedImages}
                  previews={imagePreviews}
                  onChange={handleImagesChange}
                  maxImages={5}
                />
              </FormRow>
            </div>

            {/* Cost Summary */}
            <div className="flex flex-col justify-end">
              {(estimatedCost || 0) > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimated Cost:</span>
                    <span className="font-semibold text-gray-900">₹{estimatedCost || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createServiceMutation.isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-400"
            >
              {createServiceMutation.isPending ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => {
          setShowAddCustomerModal(false);
          setInitialPhoneNumber(undefined);
        }}
        branchId={user?.activeBranch?.id || ''}
        branchName={user?.activeBranch?.name || ''}
        onSuccess={handleCustomerCreated}
        initialPhone={initialPhoneNumber}
      />

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={showAddDeviceModal}
        onClose={() => setShowAddDeviceModal(false)}
        customerId={customerId}
        onSuccess={handleDeviceCreated}
      />
    </div>
  );
}
