import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { serviceApi, CreateServiceData, PreviousServiceInfo, ActiveServiceInfo } from '@/services/serviceApi';
import { warrantyApi, WarrantyRecord, formatWarrantyDays } from '@/services/warrantyApi';
import { masterDataApi } from '@/services/masterDataApi';
import { customerDeviceApi } from '@/services/customerDeviceApi';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, AlertTriangle, ExternalLink, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { JobSheetPreviewModal } from '@/components/services/JobSheetPreviewModal';

// Zod validation schema
const serviceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  customerDeviceId: z.string().min(1, 'Please select a device'),
  faultIds: z.array(z.string()).min(1, 'Please select at least one fault'),
  deviceConditionId: z.string().min(1, 'Device condition is required'),
  devicePassword: z.string().optional(),
  devicePattern: z.string().optional(),
  accessoryIds: z.array(z.string()).optional(),
  intakeNotes: z.string().optional(),
  noDamage: z.boolean().default(false),
  damageConditionIds: z.array(z.string()).optional(),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  branchId: z.string().min(1, 'Branch ID is required'),
  dataWarrantyAccepted: z.boolean().default(false),
  sendSmsNotification: z.boolean().default(true),
  sendWhatsappNotification: z.boolean().default(false),
}).refine(
  (data) => data.noDamage || (data.damageConditionIds && data.damageConditionIds.length > 0),
  { message: 'Please add at least one damage condition or mark as No Damage', path: ['damageConditionIds'] }
);

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
  
  // Auto-selection state
  const [isDeviceAutoSelected, setIsDeviceAutoSelected] = useState(false);

  // Repeated service tracking
  const [previousServiceInfo, setPreviousServiceInfo] = useState<PreviousServiceInfo | null>(null);
  const [isCheckingPreviousServices, setIsCheckingPreviousServices] = useState(false);

  // Active service tracking (device still in service)
  const [activeServiceInfo, setActiveServiceInfo] = useState<ActiveServiceInfo | null>(null);
  const [isCheckingActiveService, setIsCheckingActiveService] = useState(false);

  // Warranty repair state
  const [isWarrantyRepair, setIsWarrantyRepair] = useState(false);
  const [warrantyReason, setWarrantyReason] = useState<string>('');

  // Job sheet modal state
  const [showJobSheetModal, setShowJobSheetModal] = useState(false);
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);

  // Active warranty claim state
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<string | null>(null);

  // Form setup - moved before queries that use watch values
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
      noDamage: false,
      damageConditionIds: [],
      estimatedCost: 0,
      branchId: '',
      dataWarrantyAccepted: false,
      sendSmsNotification: true,
      sendWhatsappNotification: false,
    },
  });

  const customerId = watch('customerId');
  const estimatedCost = watch('estimatedCost');
  const noDamage = watch('noDamage');
  
  // Fetch customer devices - now customerId is defined
  const { data: devicesData, isLoading: isLoadingDevicesList } = useQuery({
    queryKey: ['customer-devices', customerId],
    queryFn: () => customerDeviceApi.getAllDevices(customerId, { limit: 100, isActive: true }),
    enabled: !!customerId,
    staleTime: 30000,
  });

  // Fetch active warranties for selected customer
  const { data: customerWarranties, isLoading: isLoadingWarranties } = useQuery({
    queryKey: ['customer-warranties', selectedCustomer?.id],
    queryFn: () => warrantyApi.getCustomerWarranties(selectedCustomer!.id),
    enabled: !!selectedCustomer?.id,
    staleTime: 30000,
  });

  // Filter to only show active (non-expired, non-claimed) warranties
  const activeWarranties = customerWarranties?.filter(
    (w: WarrantyRecord) => !w.isExpired && !w.isClaimed
  ) || [];

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
    setPreviousServiceInfo(null);
    setIsDeviceAutoSelected(false);
  }, [customerId, setValue]);

  // Function to reset device selection
  const handleResetDevice = () => {
    setValue('customerDeviceId', '');
    setSelectedDevice(null);
    setIsDeviceAutoSelected(false);
    setPreviousServiceInfo(null);
    toast.info('Device selection cleared', { duration: 1500 });
  };

  // Check for previous services when device is selected or faults change
  const faultIds = watch('faultIds');
  // Stringify faultIds to prevent infinite re-renders (arrays compared by reference)
  const faultIdsKey = JSON.stringify(faultIds || []);
  useEffect(() => {
    if (selectedDevice?.id) {
      setIsCheckingPreviousServices(true);
      const parsedFaultIds = JSON.parse(faultIdsKey) as string[];
      serviceApi.checkPreviousServices(selectedDevice.id, parsedFaultIds)
        .then((info) => {
          setPreviousServiceInfo(info);
          // Auto-detect warranty if matching faults found
          if (info.hasFaultMatch && info.matchingFaultIds.length > 0) {
            setIsWarrantyRepair(true);
            setWarrantyReason('SAME_FAULT');
            // Set estimated cost to 0 for matching faults (warranty repair)
            const matchingSet = new Set(info.matchingFaultIds);
            const nonMatchingTotal = selectedFaults
              .filter(f => !matchingSet.has(f.id))
              .reduce((sum, f) => sum + (f.defaultPrice || 0), 0);
            setValue('estimatedCost', nonMatchingTotal);
          } else {
            setIsWarrantyRepair(false);
            setWarrantyReason('');
          }
        })
        .catch((error) => {
          console.error('Failed to check previous services:', error);
          setPreviousServiceInfo(null);
        })
        .finally(() => {
          setIsCheckingPreviousServices(false);
        });
    } else {
      setPreviousServiceInfo(null);
    }
  }, [selectedDevice?.id, faultIdsKey]);

  // Check for active services when device is selected
  useEffect(() => {
    if (selectedDevice?.id) {
      setIsCheckingActiveService(true);
      serviceApi.checkActiveServices(selectedDevice.id)
        .then((info) => {
          setActiveServiceInfo(info);
        })
        .catch((error) => {
          console.error('Failed to check active services:', error);
          setActiveServiceInfo(null);
        })
        .finally(() => {
          setIsCheckingActiveService(false);
        });
    } else {
      setActiveServiceInfo(null);
    }
  }, [selectedDevice?.id]);

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: CreateServiceData) => serviceApi.createService(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      // Show job sheet modal instead of navigating
      setCreatedServiceId(response.id);
      setShowJobSheetModal(true);
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
    // When user manually selects a device, mark it as not auto-selected
    setIsDeviceAutoSelected(false);
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

  const handleDeviceCreated = async (device: CustomerDevice) => {
    // First close the modal
    setShowAddDeviceModal(false);
    
    // Invalidate the query to refresh the device list
    await queryClient.invalidateQueries({ queryKey: ['customer-devices', customerId] });
    
    // Wait for the queries to be refetched
    await queryClient.refetchQueries({ queryKey: ['customer-devices', customerId] });
    
    // Now set the device as selected
    setValue('customerDeviceId', device.id);
    setSelectedDevice(device);
    
    // Mark as auto-selected since it's the newest device
    setIsDeviceAutoSelected(true);
    
    // Show success message
    toast.success('New device added and auto-selected', {
      description: `${device.brand?.name || ''} ${device.model?.name || ''}`.trim()
    });
  };

  const handleImagesChange = (files: File[], previews: string[]) => {
    setSelectedImages(files);
    setImagePreviews(previews);
  };

  const onSubmit = async (data: ServiceFormData) => {
    // Handle damage condition - either "No Damage" or combine selected conditions
    const damageConditionText = data.noDamage
      ? 'No Damage'
      : selectedDamageConditions.map((condition) => condition.name).join(', ');

    const submitData: CreateServiceData = {
      customerId: data.customerId,
      customerDeviceId: data.customerDeviceId,
      faultIds: data.faultIds,
      damageCondition: damageConditionText,
      damageConditionIds: data.noDamage ? [] : data.damageConditionIds,
      estimatedCost: data.estimatedCost || 0,
      branchId: data.branchId,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      // Intake fields
      devicePassword: data.devicePassword || undefined,
      devicePattern: data.devicePattern || undefined,
      deviceCondition: data.deviceConditionId,
      intakeNotes: data.intakeNotes || undefined,
      accessoryIds: data.accessoryIds && data.accessoryIds.length > 0 ? data.accessoryIds : undefined,
      // New fields
      dataWarrantyAccepted: data.dataWarrantyAccepted,
      sendSmsNotification: data.sendSmsNotification,
      sendWhatsappNotification: data.sendWhatsappNotification,
      // Warranty repair fields
      isWarrantyRepair,
      warrantyReason: isWarrantyRepair ? warrantyReason : undefined,
      matchingFaultIds: previousServiceInfo?.matchingFaultIds,
      // Warranty claim fields
      originalWarrantyId: selectedWarrantyId || undefined,
    };

    createServiceMutation.mutate(submitData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">New Service</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Section 1: Customer & Device */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Customer & Device</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <SearchableDeviceSelect
                          value={watch('customerDeviceId')}
                          onChange={handleDeviceChange}
                          customerId={customerId}
                          onAddNew={() => setShowAddDeviceModal(true)}
                          disabled={!customerId}
                          error={errors.customerDeviceId?.message}
                          placeholder={
                            !customerId
                              ? 'Select customer first'
                              : 'Select device...'
                          }
                          devices={selectedDevice ? [selectedDevice, ...(devicesData?.devices || []).filter(d => d.id !== selectedDevice.id)] : undefined}
                        />
                      </div>
                      {isDeviceAutoSelected && selectedDevice && (
                        <button
                          type="button"
                          onClick={handleResetDevice}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                          title="Device was auto-selected. Click to choose a different device"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="hidden sm:inline">Change</span>
                        </button>
                      )}
                    </div>
                    {isDeviceAutoSelected && selectedDevice && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <span>✓</span>
                        <span>Latest device auto-selected</span>
                      </p>
                    )}
                  </div>
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
                        isWarrantyRepair={isWarrantyRepair}
                        matchingFaultIds={previousServiceInfo?.matchingFaultIds || []}
                      />
                    )}
                  />
                </FormRow>
              </div>
            </div>
          </div>

          {/* Active Warranty Alert */}
          {selectedCustomer && activeWarranties.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800">Active Warranty Found!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    This customer has {activeWarranties.length} active warranty record{activeWarranties.length > 1 ? 's' : ''}:
                  </p>
                  <div className="mt-3 space-y-2">
                    {activeWarranties.map((warranty: WarrantyRecord) => (
                      <div
                        key={warranty.id}
                        className={`p-3 rounded-lg border ${
                          selectedWarrantyId === warranty.id
                            ? 'bg-green-100 border-green-400'
                            : 'bg-white border-green-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id={`warranty-${warranty.id}`}
                              name="warrantySelection"
                              checked={selectedWarrantyId === warranty.id}
                              onChange={() => {
                                setSelectedWarrantyId(warranty.id);
                                setIsWarrantyRepair(true);
                                setWarrantyReason('WARRANTY_CLAIM');
                              }}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <label htmlFor={`warranty-${warranty.id}`} className="cursor-pointer">
                              <span className="font-medium text-gray-900">{warranty.item?.itemName || 'Unknown Item'}</span>
                              <span className="text-gray-500 text-sm ml-2">({formatWarrantyDays(warranty.warrantyDays)})</span>
                            </label>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-green-700">{warranty.daysRemaining} days left</span>
                            <p className="text-xs text-gray-400">
                              {warranty.sourceType === 'SERVICE' ? (
                                <Link
                                  to={`/services/${warranty.serviceId}`}
                                  target="_blank"
                                  className="text-purple-600 hover:underline flex items-center gap-1"
                                >
                                  {warranty.service?.serviceNumber || 'View Service'}
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              ) : (
                                <span>Invoice #{warranty.invoice?.invoiceNumber}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedWarrantyId && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-800 bg-green-100 px-3 py-2 rounded-lg">
                      <ShieldAlert className="w-4 h-4" />
                      This service will be marked as a <strong>Warranty Claim</strong> (No Charge)
                    </div>
                  )}
                  {selectedWarrantyId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWarrantyId(null);
                        setIsWarrantyRepair(false);
                        setWarrantyReason('');
                      }}
                      className="mt-2 text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear warranty selection
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Service Warning - Shows when device has undelivered service */}
          {activeServiceInfo?.hasActiveService && activeServiceInfo.activeService && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-orange-800">Device Still In Service</h4>
                    <Link
                      to={`/services/${activeServiceInfo.activeService.id}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      View Active Service
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    This device already has an active service that has not been delivered.
                    You can still create a new service if needed.
                  </p>
                  <div className="mt-2 p-2 bg-white/60 rounded border border-orange-100">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Ticket:</span>
                      <span className="font-semibold text-gray-800">{activeServiceInfo.activeService.ticketNumber}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                        activeServiceInfo.activeService.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        activeServiceInfo.activeService.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        activeServiceInfo.activeService.status === 'WAITING_PARTS' ? 'bg-purple-100 text-purple-800' :
                        activeServiceInfo.activeService.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        activeServiceInfo.activeService.status === 'NOT_SERVICEABLE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activeServiceInfo.activeService.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {activeServiceInfo.activeService.faults && activeServiceInfo.activeService.faults.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Current Faults:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activeServiceInfo.activeService.faults.map((fault) => (
                            <span
                              key={fault.id}
                              className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full"
                            >
                              {fault.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Repeated Service Warning */}
          {previousServiceInfo?.isRepeated && previousServiceInfo.lastService && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-amber-800">Repeated Service</h4>
                    <Link
                      to={`/services/${previousServiceInfo.lastService.id}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      View Previous Service
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    This device was serviced <strong>{previousServiceInfo.daysSinceLastService} days ago</strong>
                  </p>
                  <div className="mt-2 p-2 bg-white/60 rounded border border-amber-100">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Ticket:</span>
                      <span className="font-semibold text-gray-800">{previousServiceInfo.lastService.ticketNumber}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">Status:</span>
                      <span className="font-medium text-gray-700">{previousServiceInfo.lastService.status.replace(/_/g, ' ')}</span>
                    </div>
                    {previousServiceInfo.lastService.faults && previousServiceInfo.lastService.faults.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Previous Faults:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {previousServiceInfo.lastService.faults.map((fault) => (
                            <span
                              key={fault.id}
                              className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full"
                            >
                              {fault.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Matching faults indicator */}
                  {previousServiceInfo.hasFaultMatch && previousServiceInfo.matchingFaultIds.length > 0 && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-green-700 text-sm font-medium">
                        Same fault detected - Warranty repair suggested
                      </span>
                    </div>
                  )}

                  {/* Warranty checkbox */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="warrantyRepair"
                      checked={isWarrantyRepair}
                      onChange={(e) => {
                        setIsWarrantyRepair(e.target.checked);
                        setWarrantyReason(e.target.checked ? 'STAFF_OVERRIDE' : '');
                      }}
                      className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <label htmlFor="warrantyRepair" className="text-sm font-medium text-gray-700">
                      Mark as Warranty Repair (No Charge)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Device Condition */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Device Condition</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormRow label="Power Status">
                  <Controller
                    control={control}
                    name="deviceConditionId"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => field.onChange('on')}
                          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            field.value === 'on'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          On
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange('off')}
                          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            field.value === 'off'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Off
                        </button>
                      </div>
                    )}
                  />
                </FormRow>

                <div className="md:col-span-2">
                  <FormRow label="Damage Condition" required={!noDamage} error={errors.damageConditionIds?.message}>
                    <div className="space-y-2">
                      <Controller
                        control={control}
                        name="noDamage"
                        render={({ field }) => (
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange(!field.value);
                              if (!field.value) {
                                setValue('damageConditionIds', []);
                                setSelectedDamageConditions([]);
                              }
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                              field.value
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            No Damage
                          </button>
                        )}
                      />
                      {!noDamage && (
                        <Controller
                          control={control}
                          name="damageConditionIds"
                          render={({ field }) => (
                            <DamageConditionTagInput
                              value={field.value || []}
                              onChange={(ids, conditions) => {
                                field.onChange(ids);
                                setSelectedDamageConditions(conditions);
                              }}
                              error={errors.damageConditionIds?.message}
                              placeholder="Type to search or add damage conditions..."
                            />
                          )}
                        />
                      )}
                    </div>
                  </FormRow>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Security & Accessories */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Security & Accessories</h3>
            </div>
            <div className="p-4">
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
            </div>
          </div>

          {/* Section 4: Additional Information */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Additional Information</h3>
            </div>
            <div className="p-4 space-y-4">
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

              <FormRow label="Device Photos">
                <MultiImageUpload
                  images={selectedImages}
                  previews={imagePreviews}
                  onChange={handleImagesChange}
                  maxImages={5}
                />
              </FormRow>
            </div>
          </div>

          {/* Section 5: Billing & Notifications */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Billing & Notifications</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <FormRow label="Customer Notification">
                  <div className="flex items-center gap-6">
                    <Controller
                      control={control}
                      name="sendSmsNotification"
                      render={({ field }) => (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div
                            onClick={() => field.onChange(!field.value)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${
                              field.value ? 'bg-purple-600' : 'bg-gray-200'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                field.value ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </div>
                          <span className="text-sm text-gray-600">SMS</span>
                        </label>
                      )}
                    />
                    <Controller
                      control={control}
                      name="sendWhatsappNotification"
                      render={({ field }) => (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div
                            onClick={() => field.onChange(!field.value)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${
                              field.value ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                field.value ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </div>
                          <span className="text-sm text-gray-600">WhatsApp</span>
                        </label>
                      )}
                    />
                  </div>
                </FormRow>
              </div>

              {/* Cost Summary */}
              {(estimatedCost || 0) > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-sm text-gray-600">Estimated Cost:</span>
                    <span className="text-xl font-bold text-purple-600">₹{estimatedCost || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createServiceMutation.isPending}
                className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors shadow-sm"
              >
                {createServiceMutation.isPending ? 'Creating...' : 'Create Service'}
              </button>
            </div>
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

      {/* Job Sheet Preview Modal */}
      {showJobSheetModal && createdServiceId && (
        <JobSheetPreviewModal
          isOpen={showJobSheetModal}
          onClose={() => {
            setShowJobSheetModal(false);
            navigate(`/services/${createdServiceId}`);
          }}
          serviceId={createdServiceId}
          onNavigateToService={() => {
            setShowJobSheetModal(false);
            navigate(`/services/${createdServiceId}`);
          }}
        />
      )}
    </div>
  );
}
