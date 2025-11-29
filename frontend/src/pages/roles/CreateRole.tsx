import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { roleApi } from '@/services/roleApi';
import { RoleFormData } from '@/types';
import { ArrowLeft, Shield, Check } from 'lucide-react';

export default function CreateRole() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissionIds: [],
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  // Fetch permissions grouped by resource
  const { data: permissionsGrouped } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: roleApi.getPermissionsGrouped,
  });

  const createMutation = useMutation({
    mutationFn: roleApi.createRole,
    onSuccess: () => {
      navigate('/admin/roles');
    },
    onError: (error: any) => {
      const responseData = error.response?.data;

      // Check if there are validation errors
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const errorMessages = responseData.errors.map((err: any) => err.message);
        setValidationErrors(errorMessages);
        setError('Please fix the following validation errors:');
      } else {
        setError(responseData?.message || 'Failed to create role');
        setValidationErrors([]);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    const data: RoleFormData = {
      name: formData.name,
      description: formData.description || undefined,
      permissionIds: Array.from(selectedPermissions),
    };

    await createMutation.mutateAsync(data);
  };

  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const selectAllInResource = (resourcePerms: any[]) => {
    const newSelected = new Set(selectedPermissions);
    const allSelected = resourcePerms.every(p => newSelected.has(p.id));

    resourcePerms.forEach(p => {
      if (allSelected) {
        newSelected.delete(p.id);
      } else {
        newSelected.add(p.id);
      }
    });

    setSelectedPermissions(newSelected);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/roles')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Role</h1>
            <p className="text-gray-600 mt-1">Add a new custom role with specific permissions</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Role Information
            </h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Sales Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe this role's responsibilities..."
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
              <p className="text-sm text-gray-600 mt-1">
                Selected {selectedPermissions.size} permission(s)
              </p>
            </div>

            <div className="space-y-4">
              {permissionsGrouped?.map((group) => (
                <div key={group.resource} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {group.resource.replace('_', ' ')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => selectAllInResource(group.permissions)}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      {group.permissions.every(p => selectedPermissions.has(p.id))
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.has(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          {selectedPermissions.has(permission.id) && (
                            <Check className="h-3 w-3 text-white absolute top-0.5 left-0.5 pointer-events-none" />
                          )}
                        </div>
                        <span className="text-sm text-gray-700">{permission.action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/roles')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
