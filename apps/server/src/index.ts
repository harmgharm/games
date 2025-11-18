import { buildServer } from './app';
import { env } from './config/env';

/**
 * Start the server with graceful shutdown handling
 */
async function start(): Promise<void> {
  const server = await buildServer();

  // Graceful shutdown handler
  const shutdown = async (signal: string): Promise<void> => {
    server.log.info(`Received ${signal}, shutting down gracefully...`);

    try {
      await server.close();
      server.log.info('Server closed successfully');
      // eslint-disable-next-line unicorn/no-process-exit -- Intentional server shutdown
      process.exit(0);
    } catch (error) {
      server.log.error(error, 'Error during shutdown');
      // eslint-disable-next-line unicorn/no-process-exit -- Intentional server shutdown
      process.exit(1);
    }
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Start listening
  await server.listen({
    port: env.PORT,
    host: env.HOST,
  });

  server.log.info(`Server running at http://${env.HOST}:${String(env.PORT)}`);
}

void start();
