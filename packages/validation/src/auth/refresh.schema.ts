/**
 * Refresh Token Schema
 */

import { z } from 'zod';

/**
 * Refresh token request schema
 * Token comes from HTTP-only cookie, not request body
 */
export const refreshSchema = z.object({});

export type RefreshInput = z.infer<typeof refreshSchema>;

/**
 * Refresh response type
 */
export interface RefreshResponse {
  accessToken: string;
}

/**
 * Logout request schema
 * Token comes from HTTP-only cookie
 */
export const logoutSchema = z.object({});

export type LogoutInput = z.infer<typeof logoutSchema>;
