/**
 * Recover Account Schema
 */

import { z } from 'zod';

/**
 * Recover account request schema
 */
export const recoverAccountSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .transform((email) => email.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

export type RecoverAccountInput = z.infer<typeof recoverAccountSchema>;

/**
 * Recover account response type
 */
export interface RecoverAccountResponse {
  message: string;
  userId: string;
}
