/**
 * Register Schema
 */

import { z } from 'zod';

/**
 * Username validation rules
 * - 3-20 characters
 * - Alphanumeric and underscores only
 * - Must start with a letter
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z]/, 'Username must start with a letter')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must be at most 255 characters')
  .transform((email) => email.toLowerCase().trim());

/**
 * Password validation
 * - Minimum 8 characters
 * - Strength check done separately with zxcvbn
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

/**
 * Register request schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be at most 50 characters')
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Register response type
 */
export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
  };
  accessToken: string;
}
