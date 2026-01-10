import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Save, Upload, Trash2, Loader2 } from 'lucide-react';
import { companyApi, Company, UpdateCompanyData } from '@/services/companyApi';

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  stateCode: string;
}

const INITIAL_FORM_DATA: FormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  gstin: '',
  stateCode: '',
};

export default function CompanySettings() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [hasChanges, setHasChanges] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch company details
  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: companyApi.getCompany,
  });

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateCompanyData) => companyApi.updateCompany(data),
    onSuccess: () => {
      toast.success('Company details updated successfully');
      queryClient.invalidateQueries({ queryKey: ['company'] });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update company details');
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => companyApi.uploadLogo(file),
    onSuccess: () => {
      toast.success('Company logo uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['company'] });
      setLogoPreview(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    },
  });

  // Delete logo mutation
  const deleteLogoMutation = useMutation({
    mutationFn: () => companyApi.deleteLogo(),
    onSuccess: () => {
      toast.success('Company logo deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete logo');
    },
  });

  // Load company data into form
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        gstin: company.gstin || '',
        stateCode: company.stateCode || '',
      });
    }
  }, [company]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    if (company) {
      setFormData({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        gstin: company.gstin || '',
        stateCode: company.stateCode || '',
      });
      setHasChanges(false);
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      uploadLogoMutation.mutate(file);
    }
  };

  const handleDeleteLogo = () => {
    if (confirm('Are you sure you want to delete the company logo?')) {
      deleteLogoMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const currentLogo = logoPreview || company?.logo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Company Settings</h2>
          <p className="text-sm text-gray-500">
            Manage your company name, logo, and contact information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo Section */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Company Logo</h3>

            <div className="flex flex-col items-center space-y-4">
              {/* Logo Preview */}
              <div
                onClick={handleLogoClick}
                className={`
                  w-32 h-32 rounded-lg border-2 border-dashed cursor-pointer
                  flex items-center justify-center overflow-hidden
                  transition-colors hover:border-purple-400 hover:bg-purple-50
                  ${currentLogo ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-100'}
                `}
              >
                {uploadLogoMutation.isPending ? (
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                ) : currentLogo ? (
                  <img
                    src={currentLogo}
                    alt="Company Logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-xs">Click to upload</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Logo Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLogoClick}
                  disabled={uploadLogoMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 inline mr-1" />
                  Upload
                </button>
                {company?.logo && (
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    disabled={deleteLogoMutation.isPending}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Remove
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                Recommended: 200x200px or larger
                <br />
                Max size: 5MB (JPEG, PNG, WebP)
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter company name"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="company@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Enter company address"
              />
            </div>

            {/* GSTIN & State Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                  maxLength={15}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                  placeholder="22AAAAA0000A1Z5"
                />
                <p className="text-xs text-gray-500 mt-1">15-character GST Identification Number</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State Code
                </label>
                <input
                  type="text"
                  value={formData.stateCode}
                  onChange={(e) => handleInputChange('stateCode', e.target.value)}
                  maxLength={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="33"
                />
                <p className="text-xs text-gray-500 mt-1">2-digit state code for GST</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasChanges || updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={!hasChanges || updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
