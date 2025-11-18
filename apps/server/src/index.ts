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
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  // Health check route
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API version route
  fastify.get('/api/v1', async () => {
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
async function start() {
  try {
    const server = await buildServer();

    await server.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
