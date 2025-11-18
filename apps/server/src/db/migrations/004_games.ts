import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Games
  await db.schema
    .createTable('games')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('game_type', sql`game_type`, (col) => col.notNull())
    .addColumn('match_type', sql`match_type`, (col) => col.notNull())
    .addColumn('status', sql`game_status`, (col) => col.notNull().defaultTo('waiting'))
    .addColumn('settings', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('winner_id', 'uuid', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('started_at', 'timestamptz')
    .addColumn('finished_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz')
    .execute();

  await db.schema.createIndex('games_status_idx').on('games').column('status').execute();
  await db.schema.createIndex('games_type_idx').on('games').column('game_type').execute();
  await db.schema.createIndex('games_created_at_idx').on('games').column('created_at').execute();

  // Game participants
  await db.schema
    .createTable('game_participants')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('game_id', 'uuid', (col) => col.notNull().references('games.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('score', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('placement', 'integer')
    .addColumn('elo_before', 'integer')
    .addColumn('elo_after', 'integer')
    .addColumn('elo_change', 'integer')
    .addColumn('joined_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('game_participants_game_idx')
    .on('game_participants')
    .column('game_id')
    .execute();
  await db.schema
    .createIndex('game_participants_user_idx')
    .on('game_participants')
    .column('user_id')
    .execute();

  // One participant per user per game
  await db.schema
    .createIndex('game_participants_unique_idx')
    .on('game_participants')
    .unique()
    .columns(['game_id', 'user_id'])
    .execute();

  // Matchmaking queue
  await db.schema
    .createTable('matchmaking_queue')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade').unique(),
    )
    .addColumn('game_type', sql`game_type`, (col) => col.notNull())
    .addColumn('match_type', sql`match_type`, (col) => col.notNull())
    .addColumn('elo', 'integer', (col) => col.notNull())
    .addColumn('rank_tier_id', 'uuid', (col) =>
      col.references('rank_tiers.id').onDelete('set null'),
    )
    .addColumn('preferences', 'jsonb')
    .addColumn('joined_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('matchmaking_queue_search_idx')
    .on('matchmaking_queue')
    .columns(['game_type', 'match_type', 'elo'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('matchmaking_queue_search_idx').ifExists().execute();
  await db.schema.dropTable('matchmaking_queue').ifExists().execute();

  await db.schema.dropIndex('game_participants_unique_idx').ifExists().execute();
  await db.schema.dropIndex('game_participants_user_idx').ifExists().execute();
  await db.schema.dropIndex('game_participants_game_idx').ifExists().execute();
  await db.schema.dropTable('game_participants').ifExists().execute();

  await db.schema.dropIndex('games_created_at_idx').ifExists().execute();
  await db.schema.dropIndex('games_type_idx').ifExists().execute();
  await db.schema.dropIndex('games_status_idx').ifExists().execute();
  await db.schema.dropTable('games').ifExists().execute();
}
