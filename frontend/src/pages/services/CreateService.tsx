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
import { ServiceCategory, ServiceIssue, Accessory } from '@/types/masters';

// Components
import { FormRow } from '@/components/common/FormRow';
import { SearchableCustomerSelectWithAdd } from '@/components/common/SearchableCustomerSelectWithAdd';
import { SearchableDeviceSelect } from '@/components/common/SearchableDeviceSelect';
import { SearchableServiceCategorySelect } from '@/components/common/SearchableServiceCategorySelect';
import { SearchableDeviceConditionSelect } from '@/components/common/SearchableDeviceConditionSelect';
import { MultiImageUpload } from '@/components/common/MultiImageUpload';
import { IssueTagInput } from '@/components/common/IssueTagInput';
import { PatternLockInput } from '@/components/common/PatternLockInput';
import { AccessoryTagInput } from '@/components/common/AccessoryTagInput';
import { AddDeviceModal } from './components/AddDeviceModal';
import AddCustomerModal from '@/components/branch/AddCustomerModal';

// Zod validation schema
const serviceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  customerDeviceId: z.string().min(1, 'Please select a device'),
  serviceCategoryId: z.string().min(1, 'Please select a service category'),
  deviceConditionId: z.string().optional(),
  devicePassword: z.string().optional(),
  devicePattern: z.string().optional(),
  accessoryIds: z.array(z.string()).optional(),
  intakeNotes: z.string().optional(),
  issueIds: z.array(z.string()).min(1, 'Please add at least one issue'),
  issueDescription: z.string().optional(),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  advancePayment: z.number().min(0, 'Advance payment cannot be negative').optional(),
  paymentMethodId: z.string().optional(),
  branchId: z.string().min(1, 'Branch ID is required'),
}).refine((data) => {
  if (data.advancePayment && data.estimatedCost && data.advancePayment > data.estimatedCost) {
    return false;
  }
  return true;
}, {
  message: 'Advance payment cannot exceed estimated cost',
  path: ['advancePayment'],
}).refine((data) => {
  if (data.advancePayment && data.advancePayment > 0 && !data.paymentMethodId) {
    return false;
  }
  return true;
}, {
  message: 'Payment method is required when advance payment is entered',
  path: ['paymentMethodId'],
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
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<ServiceIssue[]>([]);
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
      serviceCategoryId: '',
      deviceConditionId: '',
      devicePassword: '',
      devicePattern: '',
      accessoryIds: [],
      intakeNotes: '',
      issueIds: [],
      issueDescription: '',
      estimatedCost: 0,
      advancePayment: 0,
      paymentMethodId: '',
      branchId: '',
    },
  });

  const customerId = watch('customerId');
  const estimatedCost = watch('estimatedCost');
  const advancePayment = watch('advancePayment');

  // Fetch payment methods
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => masterDataApi.getAllPaymentMethods({ limit: 100, isActive: true }),
  });

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

  const handleCategoryChange = (id: string, category?: ServiceCategory) => {
    setValue('serviceCategoryId', id);
    setSelectedCategory(category || null);
    // Auto-fill estimated cost from category default price
    if (category?.defaultPrice) {
      setValue('estimatedCost', Number(category.defaultPrice));
    }
  };

  const handleConditionChange = (id: string) => {
    setValue('deviceConditionId', id);
  };

  const handleAddCustomer = (phoneNumber?: string) => {
    setInitialPhoneNumber(phoneNumber);
    setShowAddCustomerModal(true);
  };

  const handleCustomerCreated = (customer: Customer) => {
    setValue('customerId', customer.id);
    setSelectedCustomer(customer);
    setShowAddCustomerModal(false);
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
    // Build payment entries array if advance payment exists
    const paymentEntries = data.advancePayment && data.advancePayment > 0 && data.paymentMethodId
      ? [{
          amount: data.advancePayment,
          paymentMethodId: data.paymentMethodId,
          notes: 'Advance payment',
        }]
      : [];

    // Combine issue names from selected issues
    const issueNames = selectedIssues.map((issue) => issue.name).join(', ');
    const issueText = issueNames + (data.issueDescription ? ` - ${data.issueDescription}` : '');

    const submitData: CreateServiceData = {
      customerId: data.customerId,
      customerDeviceId: data.customerDeviceId,
      serviceCategoryId: data.serviceCategoryId,
      issue: issueText,
      issueIds: data.issueIds,
      estimatedCost: data.estimatedCost || 0,
      paymentEntries,
      branchId: data.branchId,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      // Intake fields
      devicePassword: data.devicePassword || undefined,
      devicePattern: data.devicePattern || undefined,
      conditionId: data.deviceConditionId || undefined,
      intakeNotes: data.intakeNotes || undefined,
      accessoryIds: data.accessoryIds && data.accessoryIds.length > 0 ? data.accessoryIds : undefined,
    };

    createServiceMutation.mutate(submitData);
  };

  const remainingAmount = (estimatedCost || 0) - (advancePayment || 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b sticky top-0 z-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
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

            <FormRow label="Service Category" required error={errors.serviceCategoryId?.message}>
              <SearchableServiceCategorySelect
                value={watch('serviceCategoryId')}
                onChange={handleCategoryChange}
                error={errors.serviceCategoryId?.message}
                placeholder="Select category..."
              />
            </FormRow>
          </div>

          {/* Row 2: Device Condition, Issue, Issue Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2">
            <FormRow label="Device Condition">
              <SearchableDeviceConditionSelect
                value={watch('deviceConditionId') || ''}
                onChange={handleConditionChange}
                placeholder="Select condition..."
              />
            </FormRow>

            <FormRow label="Issues" required error={errors.issueIds?.message}>
              <Controller
                control={control}
                name="issueIds"
                render={({ field }) => (
                  <IssueTagInput
                    value={field.value}
                    onChange={(ids, issues) => {
                      field.onChange(ids);
                      setSelectedIssues(issues);
                    }}
                    error={errors.issueIds?.message}
                    placeholder="Type to search or add issues..."
                  />
                )}
              />
            </FormRow>

            <FormRow label="Issue Description">
              <Controller
                control={control}
                name="issueDescription"
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="Additional details..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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

          {/* Row 5: Estimated Cost, Advance Payment, Payment Method */}
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

            <FormRow label="Advance Payment" error={errors.advancePayment?.message}>
              <Controller
                control={control}
                name="advancePayment"
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
                        errors.advancePayment ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                )}
              />
            </FormRow>

            <FormRow label="Payment Method" error={errors.paymentMethodId?.message}>
              <Controller
                control={control}
                name="paymentMethodId"
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={!advancePayment || advancePayment <= 0}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.paymentMethodId ? 'border-red-500' : 'border-gray-300'
                    } ${!advancePayment || advancePayment <= 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select method</option>
                    {paymentMethodsData?.data?.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </FormRow>
          </div>

          {/* Row 6: Device Photos & Payment Summary */}
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

            {/* Payment Summary */}
            <div className="flex flex-col justify-end">
              {(estimatedCost || 0) > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimated:</span>
                    <span className="font-semibold text-gray-900">₹{estimatedCost || 0}</span>
                  </div>
                  {(advancePayment || 0) > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Advance:</span>
                        <span className="font-semibold text-green-600">₹{advancePayment}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Balance:</span>
                        <span className={`font-semibold ${remainingAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                          ₹{remainingAmount}
                        </span>
                      </div>
                    </>
                  )}
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
