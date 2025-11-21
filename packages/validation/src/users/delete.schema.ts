/**
 * Delete Account Schema
 */

import { z } from 'zod';

/**
 * Delete account request schema
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
