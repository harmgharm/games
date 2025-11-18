import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

/**
 * Environment variables for the web app
 * Validated at runtime with Zod + t3-env
 */
export const env = createEnv({
  /**
   * Server-side environment variables (available during SSR)
   * These are NOT exposed to the client bundle
   */
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },

  /**
   * Client-side environment variables
   * Must be prefixed with VITE_ to be exposed
   */
  client: {
    VITE_API_URL: z.string().url(),
    VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    VITE_ENABLE_ANALYTICS: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .default('false'),
  },

  /**
   * Runtime environment values
   * TanStack Start uses Vite's import.meta.env
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    VITE_API_URL: import.meta.env.VITE_API_URL as string,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV as string | undefined,
    VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS as string | undefined,
  },

  /**
   * Client prefix for Vite
   */
  clientPrefix: 'VITE_',

  /**
   * Skip validation in certain environments
   */
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',

  /**
   * Empty string handling
   */
  emptyStringAsUndefined: true,
});
