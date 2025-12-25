import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { themeApi, CreateThemeData } from '@/services/themeApi';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Save, Palette } from 'lucide-react';
import { toast } from 'sonner';
import ThemePreview from '@/components/themes/ThemePreview';

export default function ThemeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isEditMode = !!id;

  const [formData, setFormData] = useState<CreateThemeData>({
    name: '',
    description: '',
    primaryColor: '#2563EB',
    secondaryColor: '#3B82F6',
    headerBackgroundColor: '#1E40AF',
    headerTextColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 10,
    showBranchInfo: true,
    showTermsAndConditions: true,
    termsAndConditions: '',
    footerText: '',
    isDefault: false,
    isActive: true,
  });

  const [isFullScreen, setIsFullScreen] = useState(false);

  // Fetch theme data if editing
  const { data: theme, isLoading } = useQuery({
    queryKey: ['theme', id],
    queryFn: () => themeApi.getById(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (theme) {
      setFormData({
        name: theme.name,
        description: theme.description || '',
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        headerBackgroundColor: theme.headerBackgroundColor,
        headerTextColor: theme.headerTextColor,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        showBranchInfo: theme.showBranchInfo,
        showTermsAndConditions: theme.showTermsAndConditions,
        termsAndConditions: theme.termsAndConditions || '',
        footerText: theme.footerText || '',
        isDefault: theme.isDefault,
        isActive: theme.isActive,
      });
    }
  }, [theme]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: themeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      toast.success('Theme created successfully');
      navigate('/branch/settings?tab=invoice');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create theme');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateThemeData) => themeApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      queryClient.invalidateQueries({ queryKey: ['theme', id] });
      toast.success('Theme updated successfully');
      navigate('/branch/settings?tab=invoice');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update theme');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  if (isEditMode && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading theme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/branch/settings?tab=invoice')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Palette className="w-6 h-6" />
              {isEditMode ? 'Edit Theme' : 'Create New Theme'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Edit settings on the left and see live preview on the right
            </p>
          </div>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : isEditMode
              ? 'Update Theme'
              : 'Create Theme'}
          </button>
        </div>
      </div>

      {/* Split Layout - Edit Form (Left) and Live Preview (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Edit Form */}
        <div className="w-1/2 overflow-y-auto bg-gray-50 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-600 rounded"></div>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Professional Blue"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Brief description of this theme"
              />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-600 rounded"></div>
            Colors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="#2563EB"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="headerBackgroundColor"
                  value={formData.headerBackgroundColor}
                  onChange={handleChange}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="headerBackgroundColor"
                  value={formData.headerBackgroundColor}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="#1E40AF"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header Text Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="headerTextColor"
                  value={formData.headerTextColor}
                  onChange={handleChange}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="headerTextColor"
                  value={formData.headerTextColor}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-600 rounded"></div>
            Typography
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Family
              </label>
              <select
                name="fontFamily"
                value={formData.fontFamily}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Helvetica">Helvetica</option>
                <option value="Times-Roman">Times New Roman</option>
                <option value="Courier">Courier</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size (pt)
              </label>
              <input
                type="number"
                name="fontSize"
                value={formData.fontSize}
                onChange={handleChange}
                min="8"
                max="16"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-600 rounded"></div>
            Content
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms and Conditions
              </label>
              <textarea
                name="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter terms and conditions text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Footer Text
              </label>
              <input
                type="text"
                name="footerText"
                value={formData.footerText}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Thank you for your business!"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-600 rounded"></div>
            Settings
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="showBranchInfo"
                checked={formData.showBranchInfo}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Show Branch Information</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="showTermsAndConditions"
                checked={formData.showTermsAndConditions}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Show Terms and Conditions</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Set as Default Theme</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

      </form>
        </div>

        {/* Right Side - Live Preview */}
        <div className="w-1/2 border-l">
          <ThemePreview
            theme={formData}
            isFullScreen={isFullScreen}
            onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
          />
        </div>
      </div>
    </div>
  );
}
