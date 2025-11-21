/**
 * Auth Plugin
 *
 * Configures JWT authentication for Fastify.
 */

import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { env } from '@/config/index.js';
import { db } from '@/db/index.js';

/**
 * Extend Fastify types for JWT
 */
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireVerifiedEmail: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
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

  /**
   * Require verified email decorator
   *
   * Use as onRequest hook after authenticate to require email verification:
   * @example
   * ```typescript
   * fastify.get('/chat', { onRequest: [fastify.authenticate, fastify.requireVerifiedEmail] }, handler)
   * ```
   */
  fastify.decorate('requireVerifiedEmail', async (request: FastifyRequest, reply: FastifyReply) => {
    // This assumes authenticate has already been called
    const { userId } = request.user as { userId: string };

    // Check if user's email is verified
    const user = await db
      .selectFrom('users')
      .select(['email_verified'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (user === undefined || !user.email_verified) {
      return reply.status(403).send({
        data: null,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email to access this feature',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  });
}

export default fp(authPlugin, {
  name: 'auth',
});
