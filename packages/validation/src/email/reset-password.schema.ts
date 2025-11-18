import { z } from 'zod';

/**
 * Schema for resetting password with token
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Schema for resetting password with code
 */
export const resetPasswordWithCodeSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .transform((email) => email.toLowerCase().trim()),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordWithCodeInput = z.infer<typeof resetPasswordWithCodeSchema>;
