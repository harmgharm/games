/**
 * Auth Routes
 *
 * API endpoints for authentication.
 */

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@games/validation';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';
import * as authService from './auth.service.js';
import { getRefreshTokenMaxAge, REFRESH_TOKEN_COOKIE } from './utils/token.js';

/**
 * Register auth routes
 */
export function authRoutes(fastify: FastifyInstance): void {
  /**
   * POST /register - Create a new account
   */
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = registerSchema.parse(request.body);

    const result = await authService.register(fastify, input, {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // Set refresh token cookie
    void reply.setCookie(REFRESH_TOKEN_COOKIE.name, result.refreshToken, {
      ...REFRESH_TOKEN_COOKIE.options,
      maxAge: getRefreshTokenMaxAge(false),
    });

    return sendCreated(reply, {
      user: result.user,
      accessToken: result.accessToken,
    });
  });

  /**
   * POST /login - Authenticate user
   */
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = loginSchema.parse(request.body);

    const result = await authService.login(fastify, input, {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // Set refresh token cookie
    void reply.setCookie(REFRESH_TOKEN_COOKIE.name, result.refreshToken, {
      ...REFRESH_TOKEN_COOKIE.options,
      maxAge: getRefreshTokenMaxAge(input.rememberMe),
    });

    return sendSuccess(reply, {
      user: result.user,
      accessToken: result.accessToken,
    });
  });

  /**
   * POST /refresh - Get new access token
   */
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE.name];

    if (refreshToken === undefined || refreshToken === '') {
      return reply.status(401).send({
        data: null,
        error: {
          code: 'NO_TOKEN',
          message: 'No refresh token provided',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const result = await authService.refresh(fastify, refreshToken);

    // Set new refresh token cookie (rotation)
    const remainingDays = Math.ceil(
      (result.refreshTokenExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    );
    void reply.setCookie(REFRESH_TOKEN_COOKIE.name, result.refreshToken, {
      ...REFRESH_TOKEN_COOKIE.options,
      maxAge: remainingDays * 24 * 60 * 60,
    });

    return sendSuccess(reply, {
      accessToken: result.accessToken,
    });
  });

  /**
   * POST /logout - Revoke session
   */
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE.name];

    if (refreshToken !== undefined && refreshToken !== '') {
      await authService.logout(refreshToken);
    }

    // Clear cookie
    void reply.clearCookie(REFRESH_TOKEN_COOKIE.name, {
      path: REFRESH_TOKEN_COOKIE.options.path,
    });

    return sendNoContent(reply);
  });

  /**
   * POST /verify-email - Verify email with token
   */
  fastify.post('/verify-email', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = verifyEmailSchema.parse(request.body);
    await authService.verifyEmail(input);

    return sendSuccess(reply, {
      message: 'Email verified successfully',
    });
  });

  /**
   * POST /forgot-password - Request password reset email
   */
  fastify.post('/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = forgotPasswordSchema.parse(request.body);
    await authService.forgotPassword(fastify, input);

    // Always return success to prevent email enumeration
    return sendSuccess(reply, {
      message: 'If an account with that email exists, a password reset email has been sent',
    });
  });

  /**
   * POST /reset-password - Reset password with token
   */
  fastify.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = resetPasswordSchema.parse(request.body);
    await authService.resetPassword(input);

    return sendSuccess(reply, {
      message: 'Password reset successfully',
    });
  });

  /**
   * GET /me - Get current user (protected)
   */
  fastify.get(
    '/me',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as { userId: string };
      const user = await authService.getCurrentUser(userId);

      return sendSuccess(reply, user);
    },
  );
}
