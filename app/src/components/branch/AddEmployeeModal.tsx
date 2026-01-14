import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ImageUpload from '@/components/common/ImageUpload';
import { employeeApi } from '@/services/employeeApi';
import { roleApi } from '@/services/roleApi';
import { EmployeeFormData, UserRole } from '@/types';
import { X, UserCog, Eye, EyeOff, Loader2 } from 'lucide-react';
import { showToast } from '@/lib/toast';

// Map role names to UserRole enum values
const mapRoleNameToEnum = (roleName: string): UserRole => {
  const normalizedName = roleName.toLowerCase().trim();

  if (normalizedName === 'super admin') return UserRole.SUPER_ADMIN;
  if (normalizedName === 'admin' || normalizedName === 'administrator')
    return UserRole.ADMIN;
  if (normalizedName === 'branch admin') return UserRole.BRANCH_ADMIN;
  if (normalizedName === 'manager') return UserRole.MANAGER;
  if (normalizedName === 'service admin') return UserRole.SERVICE_ADMIN;
  if (normalizedName === 'service manager') return UserRole.SERVICE_MANAGER;
  if (normalizedName === 'technician') return UserRole.TECHNICIAN;
  if (normalizedName === 'receptionist') return UserRole.RECEPTIONIST;
  if (normalizedName === 'customer support') return UserRole.CUSTOMER_SUPPORT;

  // Default fallback
  return UserRole.RECEPTIONIST;
};

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
}

export default function AddEmployeeModal({
  isOpen,
  onClose,
  branchId,
  branchName,
}: AddEmployeeModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [formData, setFormData] = useState<EmployeeFormData>({
    email: '',
    username: '',
    password: '',
    name: '',
    phone: '',
    role: UserRole.RECEPTIONIST,
    roleId: undefined,
    customRoleId: undefined,
    branchId: branchId, // Pre-fill with current branch
    isActive: true,
  });

  // Refs for focusing
  const nameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLSelectElement>(null);

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
      const username = (formData.username || '').trim();

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

  // Fetch roles for dropdown
  const { data: roles } = useQuery({
    queryKey: ['roles-list'],
    queryFn: roleApi.getRolesList,
  });

  const createMutation = useMutation({
    mutationFn: employeeApi.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchEmployees'] });
      onClose();
      resetForm();
      showToast.success('Employee created successfully');
    },
    onError: (error: any) => {
      const responseData = error.response?.data;

      // Check if there are validation errors
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const errorMessages = responseData.errors.map((err: any) => err.message);
        setValidationErrors(errorMessages);
        setError('Please fix the following validation errors:');
        showToast.error(errorMessages[0] || 'Validation failed');
      } else {
        const msg = responseData?.message || 'Failed to create employee';
        setError(msg);
        showToast.error(msg);
        setValidationErrors([]);
      }
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      name: '',
      phone: '',
      role: UserRole.RECEPTIONIST,
      customRoleId: undefined,
      branchId: branchId,
      isActive: true,
    });
    setSelectedRoleId('');
    setError('');
    setValidationErrors([]);
    setUsernameStatus('idle');
    setPasswordValidation({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    // Manual Validation
    if (!formData.name.trim()) {
      showToast.fieldRequired('Full Name');
      nameRef.current?.focus();
      return;
    }

    if (!formData.username.trim()) {
      showToast.fieldRequired('Username');
      usernameRef.current?.focus();
      return;
    }

    if (usernameStatus === 'taken') {
      showToast.error('Username is already taken');
      usernameRef.current?.focus();
      return;
    }

    if (!formData.password) {
      showToast.fieldRequired('Password');
      passwordRef.current?.focus();
      return;
    }

    // Password strength check
    if (!passwordValidation.minLength || !passwordValidation.hasUppercase || !passwordValidation.hasLowercase || !passwordValidation.hasNumber) {
      showToast.error('Password does not meet requirements');
      passwordRef.current?.focus();
      return;
    }

    if (!selectedRoleId) {
      showToast.fieldRequired('Role');
      roleRef.current?.focus();
      return;
    }

    // Prepare form data, excluding empty optional fields
    const submitData = {
      ...formData,
      email: (formData.email || '').trim() || undefined,
      phone: (formData.phone || '').trim() || undefined,
    };

    await createMutation.mutateAsync(submitData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserCog className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
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
            {/* Profile Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image
              </label>
              <ImageUpload
                value={formData.profileImage}
                onChange={(file) =>
                  setFormData({ ...formData, profileImage: file || undefined })
                }
                disabled={createMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter full name"
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

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  ref={usernameRef}
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${usernameStatus === 'taken'
                    ? 'border-red-500'
                    : usernameStatus === 'available'
                      ? 'border-green-500'
                      : 'border-gray-300'
                    }`}
                  placeholder="Unique username for login"
                />
                <div className="mt-1 space-y-1">
                  {usernameStatus === 'checking' && (
                    <p className="text-xs text-blue-600">Checking availability...</p>
                  )}
                  {usernameStatus === 'available' && (formData.username || '').length >= 3 && (
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

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
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
                      <span
                        className={
                          passwordValidation.minLength
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {passwordValidation.minLength ? '✓' : '✗'} At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={
                          passwordValidation.hasUppercase
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {passwordValidation.hasUppercase ? '✓' : '✗'} One uppercase
                        letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={
                          passwordValidation.hasLowercase
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {passwordValidation.hasLowercase ? '✓' : '✗'} One lowercase
                        letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={
                          passwordValidation.hasNumber
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {passwordValidation.hasNumber ? '✓' : '✗'} One number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Phone */}
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

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  ref={roleRef}
                  value={selectedRoleId}
                  onChange={(e) => {
                    const roleId = e.target.value;
                    setSelectedRoleId(roleId);

                    const selectedRole = roles?.find((r) => r.id === roleId);
                    if (selectedRole) {
                      setFormData({
                        ...formData,
                        role: mapRoleNameToEnum(selectedRole.name),
                        roleId: roleId,
                        customRoleId: undefined,
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a role</option>
                  {roles
                    ?.filter((role) =>
                      role.isSystemRole &&
                      role.name !== 'Super Administrator' &&
                      role.name !== 'Administrator'
                    )
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active Employee
                </label>
              </div>
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
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Employee'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
