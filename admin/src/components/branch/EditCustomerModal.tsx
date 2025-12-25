import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/services/customerApi';
import { CustomerUpdateData } from '@/types';
import { X, Users, Loader2, Upload, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
}

const ID_PROOF_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Driving License',
  'Voter ID',
  'Passport',
  'Other',
];

export default function EditCustomerModal({
  isOpen,
  onClose,
  customerId,
}: EditCustomerModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [phoneStatus, setPhoneStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [removeExistingIdProof, setRemoveExistingIdProof] = useState(false);
  const [formData, setFormData] = useState<CustomerUpdateData>({
    name: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    address: '',
    idProofType: '',
    remarks: '',
  });

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerApi.getCustomerById(customerId),
    enabled: isOpen && !!customerId,
  });

  // Pre-fill form when customer data is loaded
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        whatsappNumber: customer.whatsappNumber || '',
        email: customer.email || '',
        address: customer.address || '',
        idProofType: customer.idProofType || '',
        remarks: customer.remarks || '',
      });
    }
  }, [customer]);

  // Phone validation and availability check with debouncing
  const phoneCheckTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const checkPhone = async () => {
      const phone = formData.phone?.trim();

      // Don't check if phone is empty, not 10 digits, or same as original
      if (
        !phone ||
        phone.length !== 10 ||
        !/^\d{10}$/.test(phone) ||
        phone === customer?.phone
      ) {
        setPhoneStatus('idle');
        return;
      }

      setPhoneStatus('checking');

      try {
        const result = await customerApi.checkPhoneAvailability(phone, customerId);
        setPhoneStatus(result.available ? 'available' : 'taken');
      } catch (error) {
        setPhoneStatus('idle');
      }
    };

    // Clear previous timeout
    if (phoneCheckTimeout.current) {
      clearTimeout(phoneCheckTimeout.current);
    }

    // Set new timeout for debouncing (500ms delay)
    phoneCheckTimeout.current = setTimeout(checkPhone, 500);

    return () => {
      if (phoneCheckTimeout.current) {
        clearTimeout(phoneCheckTimeout.current);
      }
    };
  }, [formData.phone, customer?.phone, customerId]);

  const updateMutation = useMutation({
    mutationFn: (data: CustomerUpdateData) =>
      customerApi.updateCustomer(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      onClose();
      resetForm();
      alert('Customer updated successfully');
    },
    onError: (error: any) => {
      const responseData = error.response?.data;

      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const errorMessages = responseData.errors.map((err: any) => err.message);
        setValidationErrors(errorMessages);
        setError('Please fix the following validation errors:');
      } else {
        setError(responseData?.message || 'Failed to update customer');
        setValidationErrors([]);
      }
    },
  });

  const resetForm = () => {
    setIdProofFile(null);
    setRemoveExistingIdProof(false);
    setError('');
    setValidationErrors([]);
    setPhoneStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    // Validate phone number
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    if (phoneStatus === 'taken') {
      setError('Phone number already exists');
      return;
    }

    // Prepare update data
    const submitData: CustomerUpdateData = {
      ...formData,
      email: formData.email?.trim() || undefined,
      whatsappNumber: formData.whatsappNumber?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      idProofType: formData.idProofType || undefined,
      remarks: formData.remarks?.trim() || undefined,
      idProofDocument: idProofFile || undefined,
      removeIdProof: removeExistingIdProof,
    };

    await updateMutation.mutateAsync(submitData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images and PDFs only)
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Only JPG, PNG, or PDF files are allowed for ID proof');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setIdProofFile(file);
      setRemoveExistingIdProof(false);
      setError('');
    }
  };

  const handleRemoveIdProof = () => {
    setIdProofFile(null);
    setRemoveExistingIdProof(true);
  };

  if (!isOpen) return null;

  if (customerLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-gray-600">Loading customer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Customer</h2>
              <p className="text-sm text-gray-600">{customer?.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 font-semibold">{error}</p>
              {validationErrors.length > 0 && (
                <ul className="mt-2 ml-4 list-disc text-red-600 text-sm space-y-1">
                  {validationErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                    })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    phoneStatus === 'taken'
                      ? 'border-red-500'
                      : phoneStatus === 'available'
                      ? 'border-green-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="10-digit mobile number"
                />
                <div className="mt-1 space-y-1">
                  {phoneStatus === 'checking' && (
                    <p className="text-xs text-blue-600">Checking availability...</p>
                  )}
                  {phoneStatus === 'available' && formData.phone && formData.phone.length === 10 && (
                    <p className="text-xs text-green-600">✓ Phone number is available</p>
                  )}
                  {phoneStatus === 'taken' && (
                    <p className="text-xs text-red-600">✗ Phone number already exists</p>
                  )}
                  <p className="text-xs text-gray-500">Must be exactly 10 digits</p>
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>

              {/* ID Proof Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof Type
                </label>
                <select
                  value={formData.idProofType}
                  onChange={(e) =>
                    setFormData({ ...formData, idProofType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select ID proof type</option>
                  {ID_PROOF_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* ID Proof Document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof Document
                </label>
                <div className="space-y-2">
                  {/* Show existing document */}
                  {customer?.idProofDocument && !removeExistingIdProof && !idProofFile && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <a
                          href={`${API_URL}${customer.idProofDocument}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:underline"
                        >
                          View current document
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveIdProof}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Upload new document */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 cursor-pointer transition-colors">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {idProofFile
                          ? idProofFile.name
                          : removeExistingIdProof || !customer?.idProofDocument
                          ? 'Choose file'
                          : 'Replace with new file'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {idProofFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setIdProofFile(null);
                          setRemoveExistingIdProof(false);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">JPG, PNG, or PDF (max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Any additional notes"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
            disabled={updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={updateMutation.isPending || phoneStatus === 'taken'}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Customer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
