import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Create email_tokens table
  await db.schema
    .createTable('email_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('token_hash', 'bytea', (col) => col.notNull())
    .addColumn('code', 'varchar(6)', (col) => col.notNull())
    .addColumn('type', 'text', (col) =>
      col.notNull().check(sql`type IN ('verification', 'password_reset')`),
    )
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('used_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // Index for looking up tokens by hash
  await db.schema
    .createIndex('idx_email_tokens_token_hash')
    .on('email_tokens')
    .column('token_hash')
    .execute();

  // Index for looking up tokens by user and type (for cleanup/resend)
  await db.schema
    .createIndex('idx_email_tokens_user_type')
    .on('email_tokens')
    .columns(['user_id', 'type'])
    .execute();

  // Index for expiry cleanup
  await db.schema
    .createIndex('idx_email_tokens_expires_at')
    .on('email_tokens')
    .column('expires_at')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('email_tokens').execute();
}
