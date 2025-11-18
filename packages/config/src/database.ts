import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from '@games/types';
import type { Logger } from 'pino';

/**
 * Database configuration options
 */
export interface DatabaseConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeout?: number;
  connectionTimeout?: number;
  logger?: Logger;
}

/**
 * Creates a configured Kysely database instance
 *
 * @param config - Database configuration options
 * @returns Configured Kysely instance
 *
 * @example
 * ```typescript
 * const db = createDatabase({
 *   connectionString: process.env.DATABASE_URL,
 *   maxConnections: 10,
 *   logger,
 * });
 *
 * const users = await db.selectFrom('users').selectAll().execute();
 * ```
 */
export function createDatabase(config: DatabaseConfig): Kysely<Database> {
  const {
    connectionString,
    maxConnections = 10,
    idleTimeout = 30000,
    connectionTimeout = 10000,
    logger,
  } = config;

  const pool = new Pool({
    connectionString,
    max: maxConnections,
    idleTimeoutMillis: idleTimeout,
    connectionTimeoutMillis: connectionTimeout,
  });

  // Log pool events if logger is provided
  if (logger) {
    pool.on('connect', () => {
      logger.debug('Database connection established');
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'Database pool error');
    });
  }

  const dialect = new PostgresDialect({
    pool,
  });

  return new Kysely<Database>({
    dialect,
    log: logger
      ? (event) => {
          if (event.level === 'query') {
            logger.debug(
              {
                sql: event.query.sql,
                params: event.query.parameters,
                duration: event.queryDurationMillis,
              },
              'Database query',
            );
          } else if (event.level === 'error') {
            logger.error(
              {
                sql: event.query.sql,
                params: event.query.parameters,
                error: event.error,
              },
              'Database query error',
            );
          }
        }
      : undefined,
  });
}

/**
 * Closes the database connection pool
 *
 * @param db - Kysely database instance to close
 */
export async function closeDatabase(db: Kysely<Database>): Promise<void> {
  await db.destroy();
}

/**
 * Health check for database connection
 *
 * @param db - Kysely database instance
 * @returns True if connection is healthy
 */
export async function checkDatabaseHealth(db: Kysely<Database>): Promise<boolean> {
  try {
    await db.selectFrom('users').select('id').limit(1).execute();
    return true;
  } catch {
    return false;
  }
}

export type { Database } from '@games/types';
