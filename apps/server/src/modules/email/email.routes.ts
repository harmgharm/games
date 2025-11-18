/**
 * Email Routes
 *
 * API endpoints for email verification and password reset.
 */

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordWithCodeSchema,
  verifyCodeSchema,
  verifyEmailSchema,
} from '@games/validation';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { sendNoContent, sendSuccess } from '../../utils/response';
import { userRepository } from '../auth/auth.repository';
import { hashPassword } from '../auth/utils/password';
import { createEmailQueue } from './email.queue';
import { emailTokenRepository, generateCode, generateToken, hashToken } from './email.repository';

/**
 * Token expiry times
 */
const TOKEN_EXPIRY = {
  VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Rate limiting: max tokens per time window
 */
const RATE_LIMIT = {
  MAX_TOKENS: 3,
  WINDOW_MINUTES: 15,
} as const;

/**
 * Register email routes
 */
export function emailRoutes(fastify: FastifyInstance): void {
  const emailQueue = createEmailQueue(fastify);

  /**
   * GET /verify-email - Verify email via link token
   */
  fastify.get('/verify-email', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = verifyEmailSchema.parse(request.query);

    // Find token by hash
    const tokenHash = hashToken(token);
    const emailToken = await emailTokenRepository.findByHash(tokenHash);

    if (emailToken === undefined) {
      return reply.status(400).send({
        data: null,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Check if token is expired
    if (emailToken.expires_at < new Date()) {
      return reply.status(400).send({
        data: null,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Verification token has expired',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Check token type
    if (emailToken.type !== 'verification') {
      return reply.status(400).send({
        data: null,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Mark token as used
    await emailTokenRepository.markUsed(emailToken.id);

    // Update user email verified status
    await userRepository.updateEmailVerified(emailToken.user_id, true);

    // Get user to send welcome email
    const user = await userRepository.findById(emailToken.user_id);
    if (user !== undefined) {
      await emailQueue.queueWelcomeEmail(user.email, user.id, {
        username: user.username,
      });
    }

    return sendSuccess(reply, { message: 'Email verified successfully' });
  });

  /**
   * POST /verify-code - Verify email via 6-digit code (authenticated)
   */
  fastify.post(
    '/verify-code',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as { userId: string };
      const { code } = verifyCodeSchema.parse(request.body);

      // Find token by user and code
      const emailToken = await emailTokenRepository.findByUserAndCode(userId, code, 'verification');

      if (emailToken === undefined) {
        return reply.status(400).send({
          data: null,
          error: {
            code: 'INVALID_CODE',
            message: 'Invalid verification code',
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      // Check if token is expired
      if (emailToken.expires_at < new Date()) {
        return reply.status(400).send({
          data: null,
          error: {
            code: 'CODE_EXPIRED',
            message: 'Verification code has expired',
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      // Mark token as used
      await emailTokenRepository.markUsed(emailToken.id);

      // Update user email verified status
      await userRepository.updateEmailVerified(userId, true);

      // Get user to send welcome email
      const user = await userRepository.findById(userId);
      if (user !== undefined) {
        await emailQueue.queueWelcomeEmail(user.email, user.id, {
          username: user.username,
        });
      }

      return sendSuccess(reply, { message: 'Email verified successfully' });
    },
  );

  /**
   * POST /resend-verification - Resend verification email (authenticated)
   */
  fastify.post(
    '/resend-verification',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as { userId: string };

      // Get user
      const user = await userRepository.findById(userId);
      if (user === undefined) {
        return reply.status(404).send({
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      // Check if already verified
      if (user.email_verified) {
        return reply.status(400).send({
          data: null,
          error: {
            code: 'ALREADY_VERIFIED',
            message: 'Email is already verified',
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      // Rate limiting
      const recentTokens = await emailTokenRepository.countRecentTokens(
        userId,
        'verification',
        RATE_LIMIT.WINDOW_MINUTES,
      );

      if (recentTokens >= RATE_LIMIT.MAX_TOKENS) {
        return reply.status(429).send({
          data: null,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many verification emails sent. Please wait before trying again.',
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      // Invalidate existing tokens
      await emailTokenRepository.invalidateForUser(userId, 'verification');

      // Generate new token and code
      const token = generateToken();
      const code = generateCode();

      // Create email token
      await emailTokenRepository.create({
        user_id: userId,
        token_hash: hashToken(token),
        code,
        type: 'verification',
        expires_at: new Date(Date.now() + TOKEN_EXPIRY.VERIFICATION),
      });

      // Queue verification email
      await emailQueue.queueVerificationEmail(user.email, userId, {
        username: user.username,
        token,
        code,
      });

      return sendNoContent(reply);
    },
  );

  /**
   * POST /forgot-password - Request password reset
   */
  fastify.post('/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = forgotPasswordSchema.parse(request.body);

    // Find user by email
    const user = await userRepository.findByEmail(email);

    // Always return success to prevent email enumeration
    if (user === undefined) {
      return sendNoContent(reply);
    }

    // Rate limiting
    const recentTokens = await emailTokenRepository.countRecentTokens(
      user.id,
      'password_reset',
      RATE_LIMIT.WINDOW_MINUTES,
    );

    if (recentTokens >= RATE_LIMIT.MAX_TOKENS) {
      // Still return success to prevent enumeration
      return sendNoContent(reply);
    }

    // Invalidate existing tokens
    await emailTokenRepository.invalidateForUser(user.id, 'password_reset');

    // Generate new token and code
    const token = generateToken();
    const code = generateCode();

    // Create email token
    await emailTokenRepository.create({
      user_id: user.id,
      token_hash: hashToken(token),
      code,
      type: 'password_reset',
      expires_at: new Date(Date.now() + TOKEN_EXPIRY.PASSWORD_RESET),
    });

    // Queue password reset email
    await emailQueue.queuePasswordResetEmail(user.email, user.id, {
      username: user.username,
      token,
      code,
    });

    return sendNoContent(reply);
  });

  /**
   * POST /reset-password - Reset password with token
   */
  fastify.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, password } = resetPasswordSchema.parse(request.body);

    // Find token by hash
    const tokenHash = hashToken(token);
    const emailToken = await emailTokenRepository.findByHash(tokenHash);

    if (emailToken === undefined) {
      return reply.status(400).send({
        data: null,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Check if token is expired
    if (emailToken.expires_at < new Date()) {
      return reply.status(400).send({
        data: null,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Reset token has expired',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Check token type
    if (emailToken.type !== 'password_reset') {
      return reply.status(400).send({
        data: null,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Mark token as used
    await emailTokenRepository.markUsed(emailToken.id);

    // Hash new password and update user
    const passwordHash = await hashPassword(password);
    await userRepository.updatePassword(emailToken.user_id, passwordHash);

    return sendSuccess(reply, { message: 'Password reset successfully' });
  });

  /**
   * POST /reset-password-code - Reset password with code
   */
  fastify.post('/reset-password-code', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, code, password } = resetPasswordWithCodeSchema.parse(request.body);

    // Find token by email and code
    const emailToken = await emailTokenRepository.findByEmailAndCode(email, code, 'password_reset');

    if (emailToken === undefined) {
      return reply.status(400).send({
        data: null,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid reset code',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Check if token is expired
    if (emailToken.expires_at < new Date()) {
      return reply.status(400).send({
        data: null,
        error: {
          code: 'CODE_EXPIRED',
          message: 'Reset code has expired',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Mark token as used
    await emailTokenRepository.markUsed(emailToken.id);

    // Hash new password and update user
    const passwordHash = await hashPassword(password);
    await userRepository.updatePassword(emailToken.user_id, passwordHash);

    return sendSuccess(reply, { message: 'Password reset successfully' });
  });
}
