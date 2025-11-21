/**
 * Migration: Reserved Usernames Table
 *
 * Creates a table to temporarily reserve usernames for 30 days after account deletion.
 * This prevents immediate username reuse and allows for account recovery.
 */

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('reserved_usernames')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('username', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('original_email_hash', 'bytea', (col) => col.notNull())
    .addColumn('reserved_until', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // Index for cleanup job performance
  await db.schema
    .createIndex('reserved_usernames_reserved_until_idx')
    .on('reserved_usernames')
    .column('reserved_until')
    .execute();

  // Index for username lookup
  await db.schema
    .createIndex('reserved_usernames_username_idx')
    .on('reserved_usernames')
    .column('username')
    .execute();

  // Index for user_id lookup (recovery)
  await db.schema
    .createIndex('reserved_usernames_user_id_idx')
    .on('reserved_usernames')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('reserved_usernames').execute();
}
