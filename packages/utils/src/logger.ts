/**
 * Development Logger Utility
 *
 * Type-safe development logging that respects ESLint rules.
 * Pattern inspired by Vercel, Shopify, and Stripe logging utilities.
 *
 * - Environment-aware (auto-disabled in production for dev-only logs)
 * - Type-safe and ESLint compliant
 * - Semantic methods for different log levels
 */

/* eslint-disable no-console */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Development-only console logger
 * Automatically disabled in production builds for dev-only methods
 */
export const logger = {
  /**
   * Log informational message (development only)
   */
  log(...args: unknown[]): void {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log debug message (development only)
   * Use for verbose debugging
   */
  debug(...args: unknown[]): void {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log informational message (always logged)
   * Use for important info that should appear in production
   */
  info(...args: unknown[]): void {
    console.info(...args);
  },

  /**
   * Log warning message (development only)
   */
  warn(...args: unknown[]): void {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log error message (always logged)
   */
  error(...args: unknown[]): void {
    console.error(...args);
  },

  /**
   * Log grouped information (development only)
   */
  group(label: string): void {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * End grouped information (development only)
   */
  groupEnd(): void {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Log data as a table (development only)
   */
  table(data: unknown): void {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Trace function execution time (development only)
   */
  trace<T>(label: string, fn: () => T): T {
    if (!isDevelopment) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    console.log(`[${label}] ${duration.toFixed(2)}ms`);
    return result;
  },

  /**
   * Async trace function execution time (development only)
   */
  async traceAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!isDevelopment) {
      return fn();
    }

    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[${label}] ${duration.toFixed(2)}ms`);
    return result;
  },
};

/* eslint-enable no-console */

/**
 * Create a contextual logger
 * Useful for logging from specific modules or components
 *
 * @example
 * const log = createLogger('EmailService');
 * log.info('Email sent'); // [EmailService] Email sent
 */
export function createLogger(context: string) {
  return {
    log: (...args: unknown[]) => logger.log(`[${context}]`, ...args),
    debug: (...args: unknown[]) => logger.debug(`[${context}]`, ...args),
    info: (...args: unknown[]) => logger.info(`[${context}]`, ...args),
    warn: (...args: unknown[]) => logger.warn(`[${context}]`, ...args),
    error: (...args: unknown[]) => logger.error(`[${context}]`, ...args),
  };
}

/**
 * Type for contextual logger
 */
export type ContextLogger = ReturnType<typeof createLogger>;
