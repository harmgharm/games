/**
 * Email Queue Producer
 *
 * Enqueues email jobs to BullMQ for async processing.
 */

import type { FastifyInstance } from 'fastify';

import type { EmailJobData } from '@/plugins/queue.plugin.js';

/**
 * Email queue producer functions
 */
export function createEmailQueue(fastify: FastifyInstance) {
  return {
    /**
     * Queue a verification email
     */
    async queueVerificationEmail(
      to: string,
      userId: string,
      data: { username: string; token: string; code: string },
    ): Promise<void> {
      await fastify.queues.email.add(
        'verification',
        {
          type: 'verification',
          to,
          userId,
          data,
        } satisfies EmailJobData,
        {
          jobId: `verification-${userId}-${String(Date.now())}`,
        },
      );

      fastify.log.info({ to, userId }, 'Verification email queued');
    },

    /**
     * Queue a password reset email
     */
    async queuePasswordResetEmail(
      to: string,
      userId: string,
      data: { username: string; token: string; code: string },
    ): Promise<void> {
      await fastify.queues.email.add(
        'password_reset',
        {
          type: 'password_reset',
          to,
          userId,
          data,
        } satisfies EmailJobData,
        {
          jobId: `password_reset-${userId}-${String(Date.now())}`,
        },
      );

      fastify.log.info({ to, userId }, 'Password reset email queued');
    },

    /**
     * Queue a welcome email
     */
    async queueWelcomeEmail(to: string, userId: string, data: { username: string }): Promise<void> {
      await fastify.queues.email.add(
        'welcome',
        {
          type: 'welcome',
          to,
          userId,
          data,
        } satisfies EmailJobData,
        {
          jobId: `welcome-${userId}-${String(Date.now())}`,
        },
      );

      fastify.log.info({ to, userId }, 'Welcome email queued');
    },
  };
}

export type EmailQueue = ReturnType<typeof createEmailQueue>;
