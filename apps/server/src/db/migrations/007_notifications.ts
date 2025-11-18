import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Create sequences for notification tables (bigint sequential IDs)
  await sql`CREATE SEQUENCE IF NOT EXISTS seq_game_invite_notifications`.execute(db);
  await sql`CREATE SEQUENCE IF NOT EXISTS seq_friend_request_notifications`.execute(db);
  await sql`CREATE SEQUENCE IF NOT EXISTS seq_match_found_notifications`.execute(db);
  await sql`CREATE SEQUENCE IF NOT EXISTS seq_message_notifications`.execute(db);
  await sql`CREATE SEQUENCE IF NOT EXISTS seq_game_result_notifications`.execute(db);

  // Game invite notifications
  await db.schema
    .createTable('game_invite_notifications')
    .addColumn('id', 'bigint', (col) =>
      col.primaryKey().defaultTo(sql`nextval('seq_game_invite_notifications')`),
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('actor_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('game_id', 'uuid', (col) => col.notNull().references('games.id').onDelete('cascade'))
    .addColumn('is_read', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('game_invite_notifications_user_idx')
    .on('game_invite_notifications')
    .columns(['user_id', 'is_read', 'created_at'])
    .execute();

  // Friend request notifications
  await db.schema
    .createTable('friend_request_notifications')
    .addColumn('id', 'bigint', (col) =>
      col.primaryKey().defaultTo(sql`nextval('seq_friend_request_notifications')`),
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('actor_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('friendship_id', 'uuid', (col) =>
      col.notNull().references('friendships.id').onDelete('cascade'),
    )
    .addColumn('is_read', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('friend_request_notifications_user_idx')
    .on('friend_request_notifications')
    .columns(['user_id', 'is_read', 'created_at'])
    .execute();

  // Match found notifications
  await db.schema
    .createTable('match_found_notifications')
    .addColumn('id', 'bigint', (col) =>
      col.primaryKey().defaultTo(sql`nextval('seq_match_found_notifications')`),
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('game_id', 'uuid', (col) => col.notNull().references('games.id').onDelete('cascade'))
    .addColumn('is_read', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('match_found_notifications_user_idx')
    .on('match_found_notifications')
    .columns(['user_id', 'is_read', 'created_at'])
    .execute();

  // Message notifications
  await db.schema
    .createTable('message_notifications')
    .addColumn('id', 'bigint', (col) =>
      col.primaryKey().defaultTo(sql`nextval('seq_message_notifications')`),
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('actor_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('conversation_id', 'uuid', (col) =>
      col.notNull().references('conversations.id').onDelete('cascade'),
    )
    .addColumn('message_id', 'uuid', (col) =>
      col.notNull().references('messages.id').onDelete('cascade'),
    )
    .addColumn('is_read', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('message_notifications_user_idx')
    .on('message_notifications')
    .columns(['user_id', 'is_read', 'created_at'])
    .execute();

  // Game result notifications
  await db.schema
    .createTable('game_result_notifications')
    .addColumn('id', 'bigint', (col) =>
      col.primaryKey().defaultTo(sql`nextval('seq_game_result_notifications')`),
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('game_id', 'uuid', (col) => col.notNull().references('games.id').onDelete('cascade'))
    .addColumn('is_read', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('game_result_notifications_user_idx')
    .on('game_result_notifications')
    .columns(['user_id', 'is_read', 'created_at'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Drop notification tables
  await db.schema.dropIndex('game_result_notifications_user_idx').ifExists().execute();
  await db.schema.dropTable('game_result_notifications').ifExists().execute();

  await db.schema.dropIndex('message_notifications_user_idx').ifExists().execute();
  await db.schema.dropTable('message_notifications').ifExists().execute();

  await db.schema.dropIndex('match_found_notifications_user_idx').ifExists().execute();
  await db.schema.dropTable('match_found_notifications').ifExists().execute();

  await db.schema.dropIndex('friend_request_notifications_user_idx').ifExists().execute();
  await db.schema.dropTable('friend_request_notifications').ifExists().execute();

  await db.schema.dropIndex('game_invite_notifications_user_idx').ifExists().execute();
  await db.schema.dropTable('game_invite_notifications').ifExists().execute();

  // Drop sequences
  await sql`DROP SEQUENCE IF EXISTS seq_game_result_notifications`.execute(db);
  await sql`DROP SEQUENCE IF EXISTS seq_message_notifications`.execute(db);
  await sql`DROP SEQUENCE IF EXISTS seq_match_found_notifications`.execute(db);
  await sql`DROP SEQUENCE IF EXISTS seq_friend_request_notifications`.execute(db);
  await sql`DROP SEQUENCE IF EXISTS seq_game_invite_notifications`.execute(db);
}
