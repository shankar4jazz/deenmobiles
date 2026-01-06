import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/services/customerApi';
import { CustomerFormData } from '@/types';
import { X, Users, Loader2, Upload, FileText } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  onSuccess?: (customer: any) => void;
  initialPhone?: string;
}

const ID_PROOF_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Driving License',
  'Voter ID',
  'Passport',
  'Other',
];

export default function AddCustomerModal({
  isOpen,
  onClose,
  branchId,
  branchName,
  onSuccess,
  initialPhone,
}: AddCustomerModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [phoneStatus, setPhoneStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    whatsappNumber: '',
    alternativeMobile: '',
    email: '',
    address: '',
    idProofType: '',
    remarks: '',
    branchId: branchId,
  });

  // Phone validation and availability check with debouncing
  const phoneCheckTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const checkPhone = async () => {
      const phone = formData.phone.trim();

      // Don't check if phone is empty or not 10 digits
      if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
        setPhoneStatus('idle');
        return;
      }

      setPhoneStatus('checking');

      try {
        const result = await customerApi.checkPhoneAvailability(phone);
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
  }, [formData.phone]);

  // Sync whatsappNumber with phone when sameAsMobile is checked
  useEffect(() => {
    if (sameAsMobile) {
      setFormData(prev => ({ ...prev, whatsappNumber: prev.phone }));
    }
  }, [sameAsMobile, formData.phone]);

  // Pre-populate phone number when initialPhone is provided
  useEffect(() => {
    if (initialPhone && isOpen) {
      setFormData(prev => ({ ...prev, phone: initialPhone }));
    }
  }, [initialPhone, isOpen]);

  const createMutation = useMutation({
    mutationFn: customerApi.createCustomer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
      if (onSuccess) {
        onSuccess(data);
      } else {
        onClose();
      }
    },
    onError: (error: any) => {
      const responseData = error.response?.data;

      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const errorMessages = responseData.errors.map((err: any) => err.message);
        setValidationErrors(errorMessages);
        setError('Please fix the following validation errors:');
      } else {
        setError(responseData?.message || 'Failed to create customer');
        setValidationErrors([]);
      }
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      whatsappNumber: '',
      alternativeMobile: '',
      email: '',
      address: '',
      idProofType: '',
      remarks: '',
      branchId: branchId,
    });
    setIdProofFile(null);
    setSameAsMobile(false);
    setError('');
    setValidationErrors([]);
    setPhoneStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    // Validate phone number
    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    if (phoneStatus === 'taken') {
      setError('Phone number already exists');
      return;
    }

    // Prepare form data
    const submitData: CustomerFormData = {
      ...formData,
      email: formData.email?.trim() || undefined,
      whatsappNumber: formData.whatsappNumber?.trim() || undefined,
      alternativeMobile: formData.alternativeMobile?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      idProofType: formData.idProofType || undefined,
      remarks: formData.remarks?.trim() || undefined,
      idProofDocument: idProofFile || undefined,
    };

    await createMutation.mutateAsync(submitData);
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
      setError('');
    }
  };

  if (!isOpen) return null;

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
              <h2 className="text-xl font-bold text-gray-900">Add New Customer</h2>
              <p className="text-sm text-gray-600">to {branchName}</p>
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
                    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
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
                  {phoneStatus === 'available' && formData.phone.length === 10 && (
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
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="sameAsMobile"
                    checked={sameAsMobile}
                    onChange={(e) => setSameAsMobile(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sameAsMobile" className="text-sm text-gray-600">
                    Same as mobile
                  </label>
                </div>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                    })
                  }
                  disabled={sameAsMobile}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    sameAsMobile ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="Optional"
                />
              </div>

              {/* Alternative Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alternative Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.alternativeMobile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alternativeMobile: e.target.value.replace(/\D/g, '').slice(0, 10),
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
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 cursor-pointer transition-colors">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {idProofFile ? idProofFile.name : 'Choose file'}
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
                      onClick={() => setIdProofFile(null)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, or PDF (max 5MB)
                </p>
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
            disabled={createMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={createMutation.isPending || phoneStatus === 'taken'}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Customer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
