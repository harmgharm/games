import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify from 'fastify';

import { env } from './config/env';

/**
 * Create and configure Fastify server
 */
async function buildServer() {
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

  // Register plugins
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  // Health check route
  fastify.get('/health', () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API version route
  fastify.get('/api/v1', () => {
    return {
      name: '@games/server',
      version: '0.0.0',
      environment: env.NODE_ENV,
    };
  });

  return fastify;
}

/**
 * Start the server
 */
async function start(): Promise<void> {
  const server = await buildServer();

  await server.listen({
    port: env.PORT,
    host: env.HOST,
  });

  server.log.info(`Server running at http://${env.HOST}:${String(env.PORT)}`);
}

void start();
