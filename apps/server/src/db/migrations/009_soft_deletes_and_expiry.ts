import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Migration: Add soft deletes and session expiry
 *
 * Adds:
 * - deleted_at to games (for moderation/compliance)
 * - deleted_at to messages (for moderation/compliance)
 * - expires_at to sessions (explicit expiry tracking)
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  // Add soft delete to games
  await db.schema.alterTable('games').addColumn('deleted_at', 'timestamptz').execute();

  // Index for filtering out deleted games efficiently
  await db.schema
    .createIndex('games_deleted_at_idx')
    .on('games')
    .column('deleted_at')
    .where('deleted_at', 'is not', null)
    .execute();

  // Add soft delete to messages
  await db.schema.alterTable('messages').addColumn('deleted_at', 'timestamptz').execute();

  // Index for filtering out deleted messages
  await db.schema
    .createIndex('messages_deleted_at_idx')
    .on('messages')
    .column('deleted_at')
    .where('deleted_at', 'is not', null)
    .execute();

  // Add expires_at to sessions
  await db.schema
    .alterTable('sessions')
    .addColumn('expires_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now() + interval '7 days'`),
    )
    .execute();

  // Index for cleaning up expired sessions
  await db.schema
    .createIndex('sessions_expires_at_idx')
    .on('sessions')
    .column('expires_at')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Remove sessions expiry
  await db.schema.dropIndex('sessions_expires_at_idx').execute();
  await db.schema.alterTable('sessions').dropColumn('expires_at').execute();

  // Remove messages soft delete
  await db.schema.dropIndex('messages_deleted_at_idx').execute();
  await db.schema.alterTable('messages').dropColumn('deleted_at').execute();

  // Remove games soft delete
  await db.schema.dropIndex('games_deleted_at_idx').execute();
  await db.schema.alterTable('games').dropColumn('deleted_at').execute();
}
