/**
 * Transaction Helper
 *
 * Utilities for running database operations in transactions.
 */

import type { Database } from '@games/types';
import type { Transaction } from 'kysely';

import { db } from './client.js';

/**
 * Execute operations within a database transaction
 *
 * Automatically commits on success, rolls back on error.
 *
 * @example
 * ```typescript
 * const result = await withTransaction(async (trx) => {
 *   const user = await trx
 *     .insertInto('users')
 *     .values({ ... })
 *     .returningAll()
 *     .executeTakeFirstOrThrow();
 *
 *   await trx
 *     .insertInto('user_elo')
 *     .values({ user_id: user.id, game_type: 'trivia' })
 *     .execute();
 *
 *   return user;
 * });
 * ```
 */
export async function withTransaction<T>(
  fn: (trx: Transaction<Database>) => Promise<T>,
): Promise<T> {
  return db.transaction().execute(fn);
}

/**
 * Type alias for transaction parameter
 */
export type DatabaseTransaction = Transaction<Database>;
