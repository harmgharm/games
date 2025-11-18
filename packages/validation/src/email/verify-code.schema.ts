import { z } from 'zod';

/**
 * Schema for verifying email via 6-digit code
 */
export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
