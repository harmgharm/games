import {
  databaseUrlSchema,
  jwtSecretSchema,
  nodeEnvSchema,
  portSchema,
  redisUrlSchema,
} from '@games/validation/env';
import { z } from 'zod';

/**
 * Server environment variables schema
 * Validated at startup with Zod
 */
const envSchema = z.object({
  // Server
  NODE_ENV: nodeEnvSchema.default('development'),
  PORT: portSchema.default(3001),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: databaseUrlSchema,

  // Redis
  REDIS_URL: redisUrlSchema,

  // Auth
  JWT_SECRET: jwtSecretSchema,
  JWT_EXPIRES_IN: z.string().default('15m'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

/**
 * Validate and export environment variables
 * Will throw an error on startup if validation fails
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = validateEnv();

// Export type for use in other modules
export type Env = z.infer<typeof envSchema>;
