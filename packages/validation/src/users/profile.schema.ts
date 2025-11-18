/**
 * User Profile Schemas
 */

import { z } from 'zod';

/**
 * Update profile request schema
 */
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be at most 50 characters')
    .optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').max(500, 'URL too long').optional().nullable(),
  isPublic: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Public user profile response
 */
export interface PublicUserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  identityVerified: boolean;
  createdAt: Date;
}

/**
 * Private user profile response (own profile)
 */
export interface PrivateUserProfile extends PublicUserProfile {
  email: string;
  emailVerified: boolean;
  isPublic: boolean;
  status: string;
  lastLoginAt: Date | null;
  loginCount: number;
}
