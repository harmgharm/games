/**
 * Rate Limit Plugin
 *
 * Configures rate limiting with Redis backend.
 */

import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';

import { env } from '@/config/index.js';

/**
 * Rate limit configurations for auth routes
 */
export const AUTH_RATE_LIMITS = {
  register: {
    max: 5,
    timeWindow: '1 hour',
  },
  login: {
    max: 10,
    timeWindow: '1 minute',
  },
  refresh: {
    max: 30,
    timeWindow: '1 minute',
  },
  forgotPassword: {
    max: 5,
    timeWindow: '1 hour',
  },
  verifyEmail: {
    max: 10,
    timeWindow: '1 hour',
  },
  resendCode: {
    max: 3,
    timeWindow: '10 minutes',
  },
} as const;

/**
 * Rate limit plugin - sets up rate limiting with Redis
 */
async function rateLimitPlugin(fastify: FastifyInstance): Promise<void> {
  // Create Redis client for rate limiting
  const redis = new Redis(env.REDIS_URL);

  // Register rate limit plugin with Redis store
  await fastify.register(rateLimit, {
    global: false, // Don't apply globally, we'll configure per-route
    redis,
    nameSpace: 'rate-limit:',
    // Default error response
    errorResponseBuilder: (_request, context) => ({
      data: null,
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Please try again in ${String(Math.ceil(context.ttl / 1000))} seconds.`,
        details: {
          retryAfter: Math.ceil(context.ttl / 1000),
        },
      },
      meta: { timestamp: new Date().toISOString() },
    }),
  });

  // Clean up Redis connection on close
  fastify.addHook('onClose', async () => {
    await redis.quit();
  });
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit',
});
