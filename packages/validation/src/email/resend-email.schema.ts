import { z } from 'zod';

/**
 * Schema for resending verification email
 * User must be authenticated, so no email needed
 */
export const resendEmailSchema = z.object({
  // Empty object - user ID comes from auth token
});

export type ResendEmailInput = z.infer<typeof resendEmailSchema>;
