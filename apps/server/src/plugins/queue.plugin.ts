/**
 * BullMQ Queue Plugin
 *
 * Sets up BullMQ connection for job queues.
 */

import { Queue, Worker } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';

import { env } from '../config';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    queues: {
      email: Queue;
    };
    redis: Redis;
  }
}

/**
 * Queue names
 */
export const QUEUE_NAMES = {
  EMAIL: 'email',
} as const;

/**
 * Job types for the email queue
 */
export type EmailJobData =
  | {
      type: 'verification';
      to: string;
      userId: string;
      data: { username: string; token: string; code: string };
    }
  | {
      type: 'password_reset';
      to: string;
      userId: string;
      data: { username: string; token: string; code: string };
    }
  | {
      type: 'welcome';
      to: string;
      userId: string;
      data: { username: string };
    };

function queuePlugin(fastify: FastifyInstance): void {
  // Create Redis connection for BullMQ
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  // Handle connection errors
  connection.on('error', (error) => {
    fastify.log.error(error, 'Redis connection error');
  });

  // Create email queue
  const emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        count: 100, // Keep last 100 completed jobs
      },
      removeOnFail: {
        count: 500, // Keep last 500 failed jobs for debugging
      },
    },
  });

  // Decorate Fastify with queues
  fastify.decorate('queues', {
    email: emailQueue,
  });

  fastify.decorate('redis', connection);

  // Clean up on shutdown
  fastify.addHook('onClose', async () => {
    await emailQueue.close();
    await connection.quit();
    fastify.log.info('Queue connections closed');
  });

  fastify.log.info('BullMQ queues initialized');
}

export default fp(queuePlugin, {
  name: 'queue',
  dependencies: ['rate-limit'], // Ensure rate-limit is loaded first (uses same Redis)
});

/**
 * Create a worker for processing email jobs
 * This should be called separately, not in the plugin
 */
export function createEmailWorker(
  processor: (job: { data: EmailJobData }) => Promise<void>,
  redisUrl: string,
): Worker<EmailJobData> {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  return new Worker<EmailJobData>(QUEUE_NAMES.EMAIL, processor, {
    connection,
    concurrency: 5, // Process 5 emails at a time
  });
}
