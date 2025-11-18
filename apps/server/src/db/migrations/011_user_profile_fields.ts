import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Create user_status enum
  await db.schema
    .createType('user_status')
    .asEnum(['active', 'banned', 'disabled', 'deleted'])
    .execute();

  // Add new columns to users table
  await db.schema
    .alterTable('users')
    .addColumn('status', sql`user_status`, (col) => col.notNull().defaultTo('active'))
    .execute();

  await db.schema.alterTable('users').addColumn('last_login_ip', 'varchar(45)').execute();

  await db.schema
    .alterTable('users')
    .addColumn('login_count', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  await db.schema.alterTable('users').addColumn('locked_until', 'timestamptz').execute();

  await db.schema
    .alterTable('users')
    .addColumn('is_public', 'boolean', (col) => col.notNull().defaultTo(true))
    .execute();

  // Rename is_verified to identity_verified
  await db.schema.alterTable('users').renameColumn('is_verified', 'identity_verified').execute();

  // Add index for user search
  await db.schema
    .createIndex('users_display_name_idx')
    .on('users')
    .column('display_name')
    .execute();

  // Add index for status filtering
  await db.schema.createIndex('users_status_idx').on('users').column('status').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Drop indexes
  await db.schema.dropIndex('users_status_idx').ifExists().execute();
  await db.schema.dropIndex('users_display_name_idx').ifExists().execute();

  // Rename back
  await db.schema.alterTable('users').renameColumn('identity_verified', 'is_verified').execute();

  // Drop columns
  await db.schema.alterTable('users').dropColumn('is_public').execute();
  await db.schema.alterTable('users').dropColumn('locked_until').execute();
  await db.schema.alterTable('users').dropColumn('login_count').execute();
  await db.schema.alterTable('users').dropColumn('last_login_ip').execute();
  await db.schema.alterTable('users').dropColumn('status').execute();

  // Drop enum
  await db.schema.dropType('user_status').execute();
}
