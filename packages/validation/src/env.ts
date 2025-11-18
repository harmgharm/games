/**
 * Common environment variable Zod schemas
 * Reusable across frontend and backend
 */
import { z } from 'zod';

// Common schemas
export const nodeEnvSchema = z.enum(['development', 'production', 'test']);
export const portSchema = z.coerce.number().min(1).max(65535);
export const urlSchema = z.string().url();
export const booleanSchema = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

// Database
export const databaseUrlSchema = z.string().url().startsWith('postgres');

// Redis
export const redisUrlSchema = z.string().url().startsWith('redis');

// JWT
export const jwtSecretSchema = z.string().min(32);
