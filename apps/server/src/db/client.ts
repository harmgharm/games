/**
 * Database Client
 *
 * Kysely client with PostgreSQL connection pool.
 * This is the main database instance used throughout the application.
 */

import type { Database } from '@games/types';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

import { env } from '../config/env';

const { Pool } = pg;

/**
 * PostgreSQL connection pool
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Pool configuration
  min: 2,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2000,
});

/**
 * Kysely database instance
 *
 * Type-safe query builder for PostgreSQL.
 * Import this wherever you need to interact with the database.
 *
 * @example
 * ```typescript
 * import { db } from '@/db/client';
 *
 * const users = await db
 *   .selectFrom('users')
 *   .selectAll()
 *   .execute();
 * ```
 */
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
});

/**
 * Close the database connection pool
 *
 * Call this during graceful shutdown.
 */
export async function closeDatabase(): Promise<void> {
  await db.destroy();
}

/**
 * Check database connectivity
 *
 * @returns true if database is accessible
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.selectFrom('users').select('id').limit(1).execute();
    return true;
  } catch {
    return false;
  }
}
