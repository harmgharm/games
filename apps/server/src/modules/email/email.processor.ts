/**
 * Email Processor (Consumer)
 *
 * Processes email jobs from BullMQ queue.
 */

import type { Job, Worker } from 'bullmq';

import type { EmailJobData } from '../../plugins/queue.plugin';
import { createEmailWorker } from '../../plugins/queue.plugin';
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from './email.service';

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
    // eslint-disable-next-line no-console
    console.info(`Email job ${job.id ?? 'unknown'} completed: ${job.data.type} to ${job.data.to}`);
  });

  worker.on('failed', (job, error) => {
    console.error(
      `Email job ${job?.id ?? 'unknown'} failed: ${job?.data.type ?? 'unknown'} to ${job?.data.to ?? 'unknown'}`,
      error,
    );
  });

  // eslint-disable-next-line no-console
  console.info('Email worker started');

  return worker;
}

/**
 * Export for testing
 */
export { processEmailJob };
