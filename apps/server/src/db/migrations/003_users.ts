import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Users
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('username', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('display_name', 'varchar(100)')
    .addColumn('bio', 'text')
    .addColumn('avatar_url', 'text')
    .addColumn('email_verified', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('is_verified', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('last_login_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz')
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  await db.schema.createIndex('users_username_idx').on('users').column('username').execute();
  await db.schema.createIndex('users_email_idx').on('users').column('email').execute();

  // User ELO (per game type)
  await db.schema
    .createTable('user_elo')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('game_type', sql`game_type`, (col) => col.notNull())
    .addColumn('elo', 'integer', (col) => col.notNull().defaultTo(1000))
    .addColumn('rank_tier_id', 'uuid', (col) =>
      col.references('rank_tiers.id').onDelete('set null'),
    )
    .addColumn('games_played', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('wins', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('losses', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('win_streak', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('best_win_streak', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz')
    .execute();

  // One ELO record per user per game type
  await db.schema
    .createIndex('user_elo_unique_idx')
    .on('user_elo')
    .unique()
    .columns(['user_id', 'game_type'])
    .execute();

  await db.schema
    .createIndex('user_elo_elo_idx')
    .on('user_elo')
    .columns(['game_type', 'elo'])
    .execute();

  // Sessions
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('token_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('revoked_at', 'timestamptz')
    .execute();

  await db.schema.createIndex('sessions_user_id_idx').on('sessions').column('user_id').execute();
  await db.schema
    .createIndex('sessions_token_hash_idx')
    .on('sessions')
    .column('token_hash')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('sessions_token_hash_idx').ifExists().execute();
  await db.schema.dropIndex('sessions_user_id_idx').ifExists().execute();
  await db.schema.dropTable('sessions').ifExists().execute();

  await db.schema.dropIndex('user_elo_elo_idx').ifExists().execute();
  await db.schema.dropIndex('user_elo_unique_idx').ifExists().execute();
  await db.schema.dropTable('user_elo').ifExists().execute();

  await db.schema.dropIndex('users_email_idx').ifExists().execute();
  await db.schema.dropIndex('users_username_idx').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
}
