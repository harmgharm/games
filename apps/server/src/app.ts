import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify, { type FastifyInstance } from 'fastify';

import { API_PREFIX, env } from './config';
import { authRoutes } from './modules/auth/auth.routes';
import { emailRoutes } from './modules/email';
import { usersRoutes } from './modules/users';
import authPlugin from './plugins/auth.plugin';
import errorHandler from './plugins/error-handler';
import queuePlugin from './plugins/queue.plugin';
import rateLimitPlugin, { AUTH_RATE_LIMITS } from './plugins/rate-limit.plugin';

/**
 * Create and configure Fastify server
 */
export async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      // Only include transport in development (exactOptionalPropertyTypes)
      ...(env.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            },
          }
        : {}),
    },
  });

  // Register core plugins
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  // Register custom plugins
  await fastify.register(errorHandler);
  await fastify.register(authPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(queuePlugin);

  // Health check route
  fastify.get('/health', () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API version route
  fastify.get(API_PREFIX, () => {
    return {
      name: '@games/server',
      version: '0.0.0',
      environment: env.NODE_ENV,
    };
  });

  // Register auth routes with rate limiting
  await fastify.register(
    async (app) => {
      // Apply rate limits to specific routes
      app.addHook('onRoute', (routeOptions) => {
        switch (routeOptions.url) {
          case '/register': {
            routeOptions.config = {
              ...routeOptions.config,
              rateLimit: AUTH_RATE_LIMITS.register,
            };

            break;
          }
          case '/login': {
            routeOptions.config = {
              ...routeOptions.config,
              rateLimit: AUTH_RATE_LIMITS.login,
            };

            break;
          }
          case '/refresh': {
            routeOptions.config = {
              ...routeOptions.config,
              rateLimit: AUTH_RATE_LIMITS.refresh,
            };

            break;
          }
          // No default
        }
      });

      await app.register(authRoutes);
    },
    { prefix: `${API_PREFIX}/auth` },
  );

  // Register email routes with rate limiting
  await fastify.register(
    async (app) => {
      // Apply rate limits to email routes
      app.addHook('onRoute', (routeOptions) => {
        switch (routeOptions.url) {
          case '/forgot-password':
          case '/resend-verification': {
            routeOptions.config = {
              ...routeOptions.config,
              rateLimit: AUTH_RATE_LIMITS.register, // Same as register (10/15min)
            };

            break;
          }
          // No default
        }
      });

      await app.register(emailRoutes);
    },
    { prefix: `${API_PREFIX}/email` },
  );

  // Register users routes
  await fastify.register(usersRoutes, { prefix: `${API_PREFIX}/users` });

  return fastify;
}
