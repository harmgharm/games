/**
 * Email Processor (Consumer)
 *
 * Processes email jobs from BullMQ queue.
 */

import { createLogger } from '@games/utils';
import type { Job, Worker } from 'bullmq';

import type { EmailJobData } from '@/plugins/queue.plugin.js';
import { createEmailWorker } from '@/plugins/queue.plugin.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from './email.service.js';

const log = createLogger('EmailWorker');

/**
 * Process an email job
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { type, to, data } = job.data;

  switch (type) {
    case 'verification': {
      await sendVerificationEmail(to, {
        username: data.username,
        token: data.token,
        code: data.code,
      });
      break;
    }

    case 'password_reset': {
      await sendPasswordResetEmail(to, {
        username: data.username,
        token: data.token,
        code: data.code,
      });
      break;
    }

    case 'welcome': {
      await sendWelcomeEmail(to, {
        username: data.username,
      });
      break;
    }

    default: {
      // TypeScript exhaustive check
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown email type: ${String(exhaustiveCheck)}`);
    }
  }
}

/**
 * Start the email worker
 * This should be called from a separate worker process
 */
export function startEmailWorker(redisUrl: string): Worker<EmailJobData> {
  const worker = createEmailWorker(async (job) => {
    await processEmailJob(job as Job<EmailJobData>);
  }, redisUrl);

  worker.on('completed', (job) => {
    log.info(`Email job ${job.id ?? 'unknown'} completed: ${job.data.type} to ${job.data.to}`);
  });

  worker.on('failed', (job, error) => {
    log.error(
      `Email job ${job?.id ?? 'unknown'} failed: ${job?.data.type ?? 'unknown'} to ${job?.data.to ?? 'unknown'}`,
      error,
    );
  });

  log.info('Email worker started');

  return worker;
}

/**
 * Export for testing
 */
export { processEmailJob };
