import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { supplierApi } from '../../services/supplierApi';
import { SupplierFormData } from '../../types';
import {
  validateGSTNumber,
  validatePANNumber,
  validateIFSCCode,
  validatePhoneNumber,
  validatePincode,
} from '../../constants/inventory';

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  onSuccess?: () => void;
}

const EditSupplierModal: React.FC<EditSupplierModalProps> = ({
  isOpen,
  onClose,
  supplierId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<SupplierFormData>>({
    name: '',
    supplierCode: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankBranch: '',
    paymentTerms: '',
    creditLimit: 0,
    notes: '',
    active: true,
  });

  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Fetch supplier data
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => supplierApi.getSupplierById(supplierId),
    enabled: isOpen && !!supplierId,
  });

  // Pre-populate form when supplier data is loaded
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        supplierCode: supplier.supplierCode,
        companyName: supplier.companyName || '',
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        gstNumber: supplier.gstNumber || '',
        panNumber: supplier.panNumber || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        pincode: supplier.pincode || '',
        country: supplier.country || 'India',
        bankName: supplier.bankName || '',
        bankAccountNumber: supplier.bankAccountNumber || '',
        ifscCode: supplier.ifscCode || '',
        bankBranch: supplier.bankBranch || '',
        paymentTerms: supplier.paymentTerms || '',
        creditLimit: supplier.creditLimit || 0,
        notes: supplier.notes || '',
        active: supplier.active,
      });
    }
  }, [supplier]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SupplierFormData>) =>
      supplierApi.updateSupplier(supplierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update supplier');
    },
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Phone validation
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      errors.phone = 'Phone must be 10 digits';
    }

    // GST validation
    if (formData.gstNumber && !validateGSTNumber(formData.gstNumber)) {
      errors.gstNumber = 'Invalid GST number format';
    }

    // PAN validation
    if (formData.panNumber && !validatePANNumber(formData.panNumber)) {
      errors.panNumber = 'Invalid PAN number format';
    }

    // Pincode validation
    if (formData.pincode && !validatePincode(formData.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }

    // IFSC validation
    if (formData.ifscCode && !validateIFSCCode(formData.ifscCode)) {
      errors.ifscCode = 'Invalid IFSC code format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name?.trim()) {
      setError('Supplier name is required');
      return;
    }

    if (!validateForm()) {
      setError('Please fix the validation errors');
      return;
    }

    // Clean up empty fields
    const submitData: Partial<SupplierFormData> = {
      name: formData.name,
      companyName: formData.companyName || undefined,
      contactPerson: formData.contactPerson || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      gstNumber: formData.gstNumber || undefined,
      panNumber: formData.panNumber || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      pincode: formData.pincode || undefined,
      country: formData.country,
      bankName: formData.bankName || undefined,
      bankAccountNumber: formData.bankAccountNumber || undefined,
      ifscCode: formData.ifscCode || undefined,
      bankBranch: formData.bankBranch || undefined,
      paymentTerms: formData.paymentTerms || undefined,
      creditLimit: formData.creditLimit || undefined,
      notes: formData.notes || undefined,
      active: formData.active,
    };

    updateMutation.mutate(submitData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Edit Supplier</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Loading State */}
        {isLoadingSupplier ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading supplier data...</span>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Form - Same structure as AddSupplierModal */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Code
                    </label>
                    <input
                      type="text"
                      name="supplierCode"
                      value={formData.supplierCode || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      maxLength={10}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.phone
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* GST & Tax Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  GST & Tax Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber || ''}
                      onChange={handleInputChange}
                      maxLength={15}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.gstNumber
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.gstNumber && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.gstNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber || ''}
                      onChange={handleInputChange}
                      maxLength={10}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.panNumber
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.panNumber && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.panNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Address Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode || ''}
                        onChange={handleInputChange}
                        maxLength={6}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.pincode
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.pincode && (
                        <p className="text-xs text-red-600 mt-1">
                          {validationErrors.pincode}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode || ''}
                      onChange={handleInputChange}
                      maxLength={11}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.ifscCode
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.ifscCode && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.ifscCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch
                    </label>
                    <input
                      type="text"
                      name="bankBranch"
                      value={formData.bankBranch || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="bg-pink-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Payment Terms
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      name="paymentTerms"
                      value={formData.paymentTerms || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit (₹)
                    </label>
                    <input
                      type="number"
                      name="creditLimit"
                      value={formData.creditLimit || ''}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active || false}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Supplier'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EditSupplierModal;
