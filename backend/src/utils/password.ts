import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and messages
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  messages: string[];
} {
  const messages: string[] = [];

  if (password.length < 8) {
    messages.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    messages.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    messages.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    messages.push('Password must contain at least one number');
  }

  return {
    isValid: messages.length === 0,
    messages,
  };
}
