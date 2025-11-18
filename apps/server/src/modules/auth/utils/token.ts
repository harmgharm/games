/**
 * Token Utilities
 *
 * JWT payload types and refresh token generation.
 */

import crypto from 'node:crypto';

/**
 * JWT Access Token Payload
 */
export interface AccessTokenPayload {
  userId: string;
  email: string;
}

/**
 * Token expiry durations
 */
export const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH_DEFAULT: '7d',
  REFRESH_REMEMBER_ME: '30d',
} as const;

/**
 * Cookie configuration
 */
export const REFRESH_TOKEN_COOKIE = {
  name: 'refresh_token',
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/api/v1/auth',
  },
} as const;

/**
 * Generate a cryptographically secure refresh token
 *
 * @returns Random token string (64 hex characters)
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a refresh token for storage
 *
 * @param token - Plain refresh token
 * @returns SHA-256 hash of the token
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate expiry date for refresh token
 *
 * @param rememberMe - Whether to use extended expiry
 * @returns Expiry date
 */
export function getRefreshTokenExpiry(rememberMe: boolean): Date {
  const days = rememberMe ? 30 : 7;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

/**
 * Get cookie max age in seconds
 *
 * @param rememberMe - Whether to use extended expiry
 * @returns Max age in seconds
 */
export function getRefreshTokenMaxAge(rememberMe: boolean): number {
  const days = rememberMe ? 30 : 7;
  return days * 24 * 60 * 60; // days to seconds
}
