import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { serviceApi, CreateServiceData } from '@/services/serviceApi';
import { customerApi } from '@/services/customerApi';
import { brandApi, modelApi, serviceCategoryApi } from '@/services/masterDataApi';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Camera, X, Smartphone, DollarSign } from 'lucide-react';

// Zod validation schema
const serviceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  brandId: z.string().min(1, 'Please select a brand'),
  modelId: z.string().min(1, 'Please select a model'),
  serviceCategoryId: z.string().min(1, 'Please select a service category'),
  deviceIMEI: z.string().optional().refine(
    (val) => !val || /^\d{15,17}$/.test(val.replace(/\s/g, '')),
    'IMEI must be 15-17 digits'
  ),
  devicePassword: z.string().optional(),
  issue: z.string().min(10, 'Please provide a detailed description (at least 10 characters)'),
  diagnosis: z.string().optional(),
  estimatedCost: z.number().min(0.01, 'Estimated cost must be greater than 0'),
  advancePayment: z.number().min(0, 'Advance payment cannot be negative').optional(),
  branchId: z.string().min(1, 'Branch ID is required'),
}).refine((data) => {
  if (data.advancePayment && data.estimatedCost) {
    return data.advancePayment <= data.estimatedCost;
  }
  return true;
}, {
  message: 'Advance payment cannot exceed estimated cost',
  path: ['advancePayment'],
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function CreateService() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      customerId: '',
      brandId: '',
      modelId: '',
      serviceCategoryId: '',
      deviceIMEI: '',
      devicePassword: '',
      issue: '',
      diagnosis: '',
      estimatedCost: 0,
      advancePayment: 0,
      branchId: '',
    },
  });

  // Auto-fetch and set branchId from logged-in user
  useEffect(() => {
    const branchId = user?.activeBranch?.id;
    if (branchId) {
      setValue('branchId', branchId);
    } else {
      toast.error('No branch found. Please log in again.');
      navigate('/login');
    }
  }, [user, setValue, navigate]);

  // Reset modelId when brand changes
  useEffect(() => {
    if (brandId) {
      setValue('modelId', '');
    }
  }, [brandId, setValue]);

  // Auto-populate estimated cost when service category is selected
  useEffect(() => {
    if (serviceCategoryId && serviceCategoriesData?.data) {
      const selectedCategory = serviceCategoriesData.data.find(
        (cat) => cat.id === serviceCategoryId
      );
      if (selectedCategory && selectedCategory.defaultPrice > 0) {
        setValue('estimatedCost', Number(selectedCategory.defaultPrice));
      }
    }
  }, [serviceCategoryId, serviceCategoriesData, setValue]);

  // Watch form values for display purposes
  const customerId = watch('customerId');
  const brandId = watch('brandId');
  const modelId = watch('modelId');
  const serviceCategoryId = watch('serviceCategoryId');
  const estimatedCost = watch('estimatedCost');
  const advancePayment = watch('advancePayment');

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: () => customerApi.getAllCustomers({ search: customerSearch, limit: 10 }),
    enabled: customerSearch.length > 0,
  });

  // Fetch brands
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandApi.getAll({ isActive: true, limit: 100 }),
  });

  // Fetch models filtered by brand
  const { data: modelsData } = useQuery({
    queryKey: ['models', brandId],
    queryFn: () => modelApi.getAll({ isActive: true, brandId, limit: 100 }),
    enabled: !!brandId,
  });

  // Fetch service categories
  const { data: serviceCategoriesData } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => serviceCategoryApi.getAll({ isActive: true, limit: 100 }),
  });

  // Get selected customer details
  const selectedCustomer = customersData?.customers.find(
    (c) => c.id === customerId
  );

  // Create service mutation
  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      // First create the service
      const service = await serviceApi.createService(data as CreateServiceData);

      // Then upload images if any
      if (selectedImages.length > 0) {
        await serviceApi.uploadServiceImages(service.id, selectedImages);
      }

      return service;
    },
    onSuccess: (service) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service created successfully!');
      navigate(`/branch/services/${service.id}`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create service';
      toast.error(errorMessage);
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.type.startsWith('image/'));

    if (validFiles.length + selectedImages.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    setSelectedImages([...selectedImages, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ServiceFormData) => {
    // Build deviceModel from brand and model names
    const selectedBrand = brandsData?.data.find((b) => b.id === data.brandId);
    const selectedModel = modelsData?.data.find((m) => m.id === data.modelId);
    const deviceModel = `${selectedBrand?.name || ''} ${selectedModel?.name || ''}`.trim();

    // Create service data with deviceModel
    const serviceData: CreateServiceData = {
      customerId: data.customerId,
      deviceModel,
      deviceIMEI: data.deviceIMEI,
      devicePassword: data.devicePassword,
      issue: data.issue,
      diagnosis: data.diagnosis,
      estimatedCost: data.estimatedCost,
      advancePayment: data.advancePayment,
      branchId: data.branchId,
    };

    createMutation.mutate(serviceData);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/branch/services')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Service Entry</h1>
            <p className="text-sm text-gray-500 mt-1">Create a new service request</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Search by name or phone number"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.customerId && (
                <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
              )}

              {/* Customer Dropdown */}
              {showCustomerDropdown && customersData && customersData.customers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {customersData.customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setValue('customerId', customer.id, { shouldValidate: true });
                        setCustomerSearch(customer.name);
                        setShowCustomerDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Customer Display */}
            {selectedCustomer && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{selectedCustomer.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>Phone: {selectedCustomer.phone}</div>
                      {selectedCustomer.email && <div>Email: {selectedCustomer.email}</div>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('customerId', '', { shouldValidate: true });
                      setCustomerSearch('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Device Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Device Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand <span className="text-red-500">*</span>
              </label>
              <select
                {...register('brandId')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.brandId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a brand</option>
                {brandsData?.data.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {errors.brandId && (
                <p className="mt-1 text-sm text-red-600">{errors.brandId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model <span className="text-red-500">*</span>
              </label>
              <select
                {...register('modelId')}
                disabled={!brandId}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.modelId ? 'border-red-500' : 'border-gray-300'
                } ${!brandId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">
                  {brandId ? 'Select a model' : 'Select a brand first'}
                </option>
                {modelsData?.data.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              {errors.modelId && (
                <p className="mt-1 text-sm text-red-600">{errors.modelId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IMEI Number
              </label>
              <input
                type="text"
                {...register('deviceIMEI')}
                placeholder="15 digit IMEI number"
                maxLength={17}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.deviceIMEI ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.deviceIMEI && (
                <p className="mt-1 text-sm text-red-600">{errors.deviceIMEI.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Password/PIN
              </label>
              <input
                type="text"
                {...register('devicePassword')}
                placeholder="Password or PIN to unlock device"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">This will help technicians test the device after repair</p>
            </div>
          </div>
        </div>

        {/* Issue & Diagnosis */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Problem Description</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('serviceCategoryId')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.serviceCategoryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a service category</option>
                {serviceCategoriesData?.data.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} {category.defaultPrice > 0 ? `(₹${category.defaultPrice})` : ''}
                  </option>
                ))}
              </select>
              {errors.serviceCategoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.serviceCategoryId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('issue')}
                placeholder="Describe the problem with the device..."
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.issue ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.issue && (
                <p className="mt-1 text-sm text-red-600">{errors.issue.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis (Optional)
              </label>
              <textarea
                {...register('diagnosis')}
                placeholder="Initial diagnosis or notes..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Device Photos */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Device Photos
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photos (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum 10 images, 5MB each</p>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Cost <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  {...register('estimatedCost', { valueAsNumber: true })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.estimatedCost ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.estimatedCost && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedCost.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Payment
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  {...register('advancePayment', { valueAsNumber: true })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.advancePayment ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.advancePayment && (
                <p className="mt-1 text-sm text-red-600">{errors.advancePayment.message}</p>
              )}
            </div>
          </div>

          {/* Cost Summary */}
          {estimatedCost > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Cost:</span>
                <span className="font-medium">₹{estimatedCost.toFixed(2)}</span>
              </div>
              {advancePayment > 0 && (
                <>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Advance Payment:</span>
                    <span className="font-medium text-green-600">₹{advancePayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-900 font-semibold">Balance Due:</span>
                    <span className="font-semibold">₹{(estimatedCost - advancePayment).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? 'Creating Service...' : 'Create Service'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/branch/services')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
