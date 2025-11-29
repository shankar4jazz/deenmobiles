import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import ImageUpload from '@/components/common/ImageUpload';
import { employeeApi } from '@/services/employeeApi';
import { branchApi } from '@/services/branchApi';
import { roleApi } from '@/services/roleApi';
import { EmployeeFormData, UserRole } from '@/types';
import { ArrowLeft, UserCog, Eye, EyeOff } from 'lucide-react';

// Map role names to UserRole enum values
const mapRoleNameToEnum = (roleName: string): UserRole => {
  const normalizedName = roleName.toLowerCase().trim();

  if (normalizedName === 'super admin') return UserRole.SUPER_ADMIN;
  if (normalizedName === 'admin' || normalizedName === 'administrator') return UserRole.ADMIN;
  if (normalizedName === 'manager') return UserRole.MANAGER;
  if (normalizedName === 'technician') return UserRole.TECHNICIAN;
  if (normalizedName === 'receptionist') return UserRole.RECEPTIONIST;

  // Default fallback
  return UserRole.RECEPTIONIST;
};

export default function CreateEmployee() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [formData, setFormData] = useState<EmployeeFormData>({
    email: '',
    username: '',
    password: '',
    name: '',
    phone: '',
    role: UserRole.RECEPTIONIST,
    customRoleId: undefined,
    branchId: undefined,
    isActive: true,
  });

  // Password validation function
  const validatePassword = (password: string) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    });
  };

  // Handle password change with validation
  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    validatePassword(value);
  };

  // Username availability check with debouncing
  const usernameCheckTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const checkUsername = async () => {
      const username = formData.username.trim();

      // Don't check if username is empty or too short
      if (!username || username.length < 3) {
        setUsernameStatus('idle');
        return;
      }

      // Validate format first
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setUsernameStatus('idle');
        return;
      }

      setUsernameStatus('checking');

      try {
        const result = await employeeApi.checkUsernameAvailability(username);
        setUsernameStatus(result.available ? 'available' : 'taken');
      } catch (error) {
        setUsernameStatus('idle');
      }
    };

    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Set new timeout for debouncing (500ms delay)
    usernameCheckTimeout.current = setTimeout(checkUsername, 500);

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [formData.username]);

  // Fetch branches and roles for dropdowns
  const { data: branches } = useQuery({
    queryKey: ['branches-list'],
    queryFn: branchApi.getBranchList,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles-list'],
    queryFn: roleApi.getRolesList,
  });

  const createMutation = useMutation({
    mutationFn: employeeApi.createEmployee,
    onSuccess: () => {
      navigate('/admin/employees');
    },
    onError: (error: any) => {
      const responseData = error.response?.data;

      // Check if there are validation errors
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const errorMessages = responseData.errors.map((err: any) => err.message);
        setValidationErrors(errorMessages);
        setError('Please fix the following validation errors:');
      } else {
        setError(responseData?.message || 'Failed to create employee');
        setValidationErrors([]);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    // Prepare form data, excluding empty optional fields
    const submitData = {
      ...formData,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
    };

    await createMutation.mutateAsync(submitData);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/employees')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Employee</h1>
            <p className="text-gray-600 mt-1">Add a new team member</p>
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
              <UserCog className="h-5 w-5 text-purple-600" />
              Employee Information
            </h2>

            {/* Profile Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image
              </label>
              <ImageUpload
                value={formData.profileImage}
                onChange={(file) => setFormData({ ...formData, profileImage: file || undefined })}
                disabled={createMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    usernameStatus === 'taken' ? 'border-red-500' :
                    usernameStatus === 'available' ? 'border-green-500' : 'border-gray-300'
                  }`}
                  placeholder="Unique username for login"
                />
                <div className="mt-1 space-y-1">
                  {usernameStatus === 'checking' && (
                    <p className="text-xs text-blue-600">Checking availability...</p>
                  )}
                  {usernameStatus === 'available' && formData.username.length >= 3 && (
                    <p className="text-xs text-green-600">✓ Username is available</p>
                  )}
                  {usernameStatus === 'taken' && (
                    <p className="text-xs text-red-600">✗ Username is already taken</p>
                  )}
                  <p className="text-xs text-gray-500">
                    3-30 characters, letters, numbers, hyphens, and underscores only
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}>
                        {passwordValidation.minLength ? '✓' : '✗'} At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={passwordValidation.hasUppercase ? 'text-green-600' : 'text-red-600'}>
                        {passwordValidation.hasUppercase ? '✓' : '✗'} One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={passwordValidation.hasLowercase ? 'text-green-600' : 'text-red-600'}>
                        {passwordValidation.hasLowercase ? '✓' : '✗'} One lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}>
                        {passwordValidation.hasNumber ? '✓' : '✗'} One number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  required
                  value={selectedRoleId}
                  onChange={(e) => {
                    const roleId = e.target.value;
                    setSelectedRoleId(roleId);

                    const selectedRole = roles?.find(r => r.id === roleId);
                    if (selectedRole?.isSystemRole) {
                      // If system role selected, map role name to enum and clear customRoleId
                      setFormData({
                        ...formData,
                        role: mapRoleNameToEnum(selectedRole.name),
                        customRoleId: undefined
                      });
                    } else {
                      // If custom role selected, set customRoleId and default role
                      setFormData({
                        ...formData,
                        customRoleId: roleId,
                        role: UserRole.RECEPTIONIST
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a role</option>
                  <optgroup label="System Roles">
                    {roles?.filter(role => role.isSystemRole).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Custom Roles">
                    {roles?.filter(role => !role.isSystemRole).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <select
                  value={formData.branchId || ''}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">No branch assigned</option>
                  {branches?.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active Employee
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
