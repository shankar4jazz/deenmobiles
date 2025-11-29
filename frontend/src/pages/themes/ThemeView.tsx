import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { themeApi } from '@/services/themeApi';
import { ArrowLeft, Edit, Trash2, ToggleLeft, ToggleRight, Star, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ThemeView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Fetch theme data
  const { data: theme, isLoading, error } = useQuery({
    queryKey: ['theme', id],
    queryFn: () => themeApi.getById(id!),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => themeApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      toast.success('Theme deleted successfully');
      navigate('/branch/settings?tab=invoice');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete theme');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: () => themeApi.toggleStatus(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme', id] });
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      toast.success('Theme status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update theme status');
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: () => themeApi.setAsDefault(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme', id] });
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      toast.success('Theme set as default');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set default theme');
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${theme?.name}"?`)) {
      deleteMutation.mutate();
    }
  };

  const handleToggleStatus = () => {
    toggleStatusMutation.mutate();
  };

  const handleSetDefault = () => {
    if (window.confirm(`Set "${theme?.name}" as the default theme?`)) {
      setDefaultMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading theme...</p>
        </div>
      </div>
    );
  }

  if (error || !theme) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Failed to load theme</p>
          <button
            onClick={() => navigate('/branch/settings?tab=invoice')}
            className="mt-4 text-purple-600 hover:text-purple-700"
          >
            Back to Themes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/branch/settings?tab=invoice')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{theme.name}</h1>
              {theme.isDefault && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-500" />
                  Default
                </span>
              )}
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  theme.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {theme.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {theme.description && (
              <p className="text-sm text-gray-500 mt-1">{theme.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!theme.isDefault && (
            <button
              onClick={handleSetDefault}
              disabled={setDefaultMutation.isPending}
              className="px-4 py-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              Set as Default
            </button>
          )}
          <button
            onClick={handleToggleStatus}
            disabled={toggleStatusMutation.isPending || (theme.isDefault && theme.isActive)}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {theme.isActive ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Deactivate
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={() => navigate(`/branch/settings?tab=invoice/${id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          {!theme.isDefault && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colors */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Colors</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Primary Color</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <span className="text-sm font-mono text-gray-900">{theme.primaryColor}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Secondary Color</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: theme.secondaryColor }}
                />
                <span className="text-sm font-mono text-gray-900">{theme.secondaryColor}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Header Background</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: theme.headerBackgroundColor }}
                />
                <span className="text-sm font-mono text-gray-900">{theme.headerBackgroundColor}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Header Text</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: theme.headerTextColor }}
                />
                <span className="text-sm font-mono text-gray-900">{theme.headerTextColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Typography</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Font Family</span>
              <span className="text-sm font-medium text-gray-900">{theme.fontFamily}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Font Size</span>
              <span className="text-sm font-medium text-gray-900">{theme.fontSize}pt</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
          <div className="space-y-4">
            {theme.termsAndConditions && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms and Conditions
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap">
                  {theme.termsAndConditions}
                </div>
              </div>
            )}
            {theme.footerText && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Footer Text
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                  {theme.footerText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Show Branch Info</span>
              {theme.showBranchInfo ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Show Terms & Conditions</span>
              {theme.showTermsAndConditions ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Information</h2>
          <div className="space-y-3">
            {theme.branch ? (
              <div>
                <span className="text-sm text-gray-600 block">Branch</span>
                <span className="text-sm font-medium text-gray-900">{theme.branch.name}</span>
                <span className="text-xs text-gray-500 ml-2">({theme.branch.code})</span>
              </div>
            ) : (
              <div>
                <span className="text-sm text-gray-600 block">Scope</span>
                <span className="text-sm font-medium text-gray-900">Company-wide</span>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-600 block">Created By</span>
              <span className="text-sm font-medium text-gray-900">{theme.createdByUser.name}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600 block">Created At</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(theme.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600 block">Last Updated</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(theme.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
