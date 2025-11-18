/**
 * Auth Plugin
 *
 * Configures JWT authentication for Fastify.
 */

import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { env } from '../config/env';

/**
 * Extend Fastify types for JWT
 */
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; email: string };
    user: { userId: string; email: string };
  }
}

/**
 * Auth plugin - sets up JWT and cookie support
 */
async function authPlugin(fastify: FastifyInstance): Promise<void> {
  // Register cookie plugin
  await fastify.register(fastifyCookie);

  // Register JWT plugin
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  /**
   * Authenticate decorator
   *
   * Use as onRequest hook to protect routes:
   * @example
   * ```typescript
   * fastify.get('/protected', { onRequest: [fastify.authenticate] }, handler)
   * ```
   */
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  });
}

export default fp(authPlugin, {
  name: 'auth',
});
