/**
 * Cleanup Processor (Consumer)
 *
 * Processes scheduled cleanup jobs from BullMQ queue.
 */

import { createLogger } from '@games/utils';
import type { Worker } from 'bullmq';
import { Queue, Worker as BullWorker } from 'bullmq';

import { deletionService } from './deletion.service.js';

const log = createLogger('CleanupWorker');

/**
 * Process cleanup job
 */
async function processCleanupJob(): Promise<void> {
  log.info('Running cleanup job for expired username reservations...');
  const deletedCount = await deletionService.cleanupExpiredReservations();
  log.info(`Cleanup completed. Released ${deletedCount.toString()} expired username reservations.`);
}

/**
 * Start the cleanup worker
 * This should be called from a separate worker process
 */
export function startCleanupWorker(redisUrl: string): Worker {
  const worker = new BullWorker(
    'cleanup',
    async () => {
      await processCleanupJob();
    },
    {
      connection: {
        url: redisUrl,
      },
    },
  );

  worker.on('completed', (job) => {
    log.info(`Cleanup job ${job.id ?? 'unknown'} completed`);
  });

  worker.on('failed', (job, error) => {
    log.error(`Cleanup job ${job?.id ?? 'unknown'} failed`, error);
  });

  log.info('Cleanup worker started');

  return worker;
}

/**
 * Schedule the cleanup job
 * Runs daily at 3 AM
 */
export function scheduleCleanupJob(redisUrl: string): Queue {
  const queue = new Queue('cleanup', {
    connection: {
      url: redisUrl,
    },
  });

  // Add repeatable job (runs daily at 3 AM)
  void queue.add(
    'cleanup-expired-reservations',
    {},
    {
      repeat: {
        pattern: '0 3 * * *', // Cron: 3 AM daily
      },
    },
  );

  log.info('Cleanup job scheduled (daily at 3 AM)');

  return queue;
}

/**
 * Export for testing
 */
export { processCleanupJob };
