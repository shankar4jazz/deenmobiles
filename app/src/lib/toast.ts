import { toast } from 'sonner';

/**
 * Global Toast Utility
 * Provides consistent toast notifications across the application
 */
export const showToast = {
  // Basic toast types
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),

  // Field validation helpers
  fieldRequired: (fieldName: string) =>
    toast.warning(`Please fill ${fieldName} - it is required`),

  fieldInvalid: (fieldName: string, reason: string) =>
    toast.warning(`${fieldName}: ${reason}`),

  // Common validation messages
  validation: {
    required: (fieldName: string) =>
      toast.warning(`Please fill ${fieldName} - it is required`),

    minLength: (fieldName: string, min: number) =>
      toast.warning(`${fieldName} must be at least ${min} characters`),

    maxLength: (fieldName: string, max: number) =>
      toast.warning(`${fieldName} must be at most ${max} characters`),

    exactLength: (fieldName: string, length: number) =>
      toast.warning(`${fieldName} must be exactly ${length} characters`),

    invalidFormat: (fieldName: string, format?: string) =>
      toast.warning(`${fieldName} has invalid format${format ? ` (expected: ${format})` : ''}`),

    invalidPhone: () =>
      toast.warning('Phone Number must be exactly 10 digits'),

    invalidEmail: () =>
      toast.warning('Please enter a valid email address'),
  },
};

// Re-export toast from sonner for direct usage if needed
export { toast };
