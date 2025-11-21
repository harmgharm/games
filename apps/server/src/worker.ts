/**
 * Worker Entry Point
 *
 * Starts background workers for processing jobs from BullMQ.
 * Run separately from the main API server.
 *
 * Workers:
 * - Email worker: Processes email sending jobs
 * - Cleanup worker: Processes scheduled cleanup jobs (expired username reservations)
 *
 * Usage:
 *   pnpm --filter @games/server worker
 */

import { createLogger } from '@games/utils';

import { env } from './config';
import { startEmailWorker } from './modules/email/email.processor';
import { scheduleCleanupJob, startCleanupWorker } from './modules/users/cleanup.processor';

const log = createLogger('Worker');

log.info('Starting workers...');
log.info(`Environment: ${env.NODE_ENV}`);

// Mask credentials in Redis URL for logging
const maskedRedisUrl = env.REDIS_URL.includes('@')
  ? `${env.REDIS_URL.slice(0, env.REDIS_URL.indexOf('//') + 2)}<credentials>@${env.REDIS_URL.slice(env.REDIS_URL.indexOf('@') + 1)}`
  : env.REDIS_URL;
log.info(`Redis URL: ${maskedRedisUrl}`);

// Start workers
const emailWorker = startEmailWorker(env.REDIS_URL);
const cleanupWorker = startCleanupWorker(env.REDIS_URL);

// Schedule cleanup job (runs daily at 3 AM)
const cleanupQueue = scheduleCleanupJob(env.REDIS_URL);

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  log.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await Promise.all([emailWorker.close(), cleanupWorker.close(), cleanupQueue.close()]);
    log.info('All workers closed successfully');
    // eslint-disable-next-line unicorn/no-process-exit -- Worker process requires explicit exit
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown:', error);
    // eslint-disable-next-line unicorn/no-process-exit -- Worker process requires explicit exit
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  void shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
  void shutdown('unhandledRejection');
});

log.info('Workers are running. Press Ctrl+C to stop.');
