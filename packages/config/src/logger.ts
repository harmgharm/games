import pino, { type Logger, type LoggerOptions } from 'pino';

/**
 * Log levels supported by the logger
 */
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  level: LogLevel;
  serviceName: string;
  environment: 'development' | 'production' | 'test';
  pretty?: boolean;
}

/**
 * Creates a configured Pino logger instance
 *
 * @param config - Logger configuration options
 * @returns Configured Pino logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger({
 *   level: 'info',
 *   serviceName: 'api',
 *   environment: 'production',
 * });
 *
 * logger.info({ userId: '123' }, 'User logged in');
 * ```
 */
export function createLogger(config: LoggerConfig): Logger {
  const { level, serviceName, environment, pretty } = config;

  const isDevelopment = environment === 'development';
  const shouldPrettyPrint = pretty ?? isDevelopment;

  const options: LoggerOptions = {
    level,
    base: {
      service: serviceName,
      env: environment,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    // Redact sensitive fields
    redact: {
      paths: ['password', 'token', 'authorization', 'cookie', 'secret', '*.password', '*.token'],
      remove: true,
    },
  };

  // Pretty print in development for better readability
  if (shouldPrettyPrint) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  }

  return pino(options);
}

/**
 * Creates a child logger with additional context
 *
 * @param parent - Parent logger instance
 * @param bindings - Additional context to bind to the logger
 * @returns Child logger with bound context
 *
 * @example
 * ```typescript
 * const requestLogger = createChildLogger(logger, {
 *   requestId: 'req-123',
 *   userId: 'user-456',
 * });
 * ```
 */
export function createChildLogger(parent: Logger, bindings: Record<string, unknown>): Logger {
  return parent.child(bindings);
}

/**
 * Default logger instance for quick usage
 * Should be replaced with a properly configured logger in production
 */
export const defaultLogger = createLogger({
  level: 'info',
  serviceName: 'games',
  environment: 'development',
});

export type { Logger } from 'pino';
