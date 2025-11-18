import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Migration: Add missing constraints and indexes
 *
 * Fixes:
 * - ConversationParticipants: UNIQUE(conversation_id, user_id)
 * - Messages: index on (conversation_id, created_at)
 * - UserElo: UNIQUE(user_id, game_type)
 * - Blocks: UNIQUE(blocker_id, blocked_id)
 * - Mutes: UNIQUE(muter_id, muted_id)
 * - GameTypeConfigs: UNIQUE(game_type, setting_key)
 * - Sessions: explicit VARCHAR length and index for token_hash
 * - MatchmakingQueue: change to composite PK (user_id, game_type, match_type)
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  // ConversationParticipants: prevent duplicate participants
  await db.schema
    .alterTable('conversation_participants')
    .addUniqueConstraint('conversation_participants_conversation_user_unique', [
      'conversation_id',
      'user_id',
    ])
    .execute();

  // Messages: index for fetching recent messages in conversation
  await db.schema
    .createIndex('messages_conversation_created_idx')
    .on('messages')
    .columns(['conversation_id', 'created_at'])
    .execute();

  // UserElo: one ELO record per user per game type
  await db.schema
    .alterTable('user_elo')
    .addUniqueConstraint('user_elo_user_game_type_unique', ['user_id', 'game_type'])
    .execute();

  // Blocks: prevent duplicate blocks
  await db.schema
    .alterTable('blocks')
    .addUniqueConstraint('blocks_blocker_blocked_unique', ['blocker_id', 'blocked_id'])
    .execute();

  // Mutes: prevent duplicate mutes
  await db.schema
    .alterTable('mutes')
    .addUniqueConstraint('mutes_muter_muted_unique', ['muter_id', 'muted_id'])
    .execute();

  // GameTypeConfigs: one config per game type per setting
  await db.schema
    .alterTable('game_type_configs')
    .addUniqueConstraint('game_type_configs_type_key_unique', ['game_type', 'setting_key'])
    .execute();

  // Sessions: add index on token_hash for fast lookups
  await db.schema
    .createIndex('sessions_token_hash_idx')
    .on('sessions')
    .column('token_hash')
    .execute();

  // MatchmakingQueue: rebuild with composite primary key
  // Drop existing table and recreate with proper structure
  await db.schema.dropTable('matchmaking_queue').execute();

  await db.schema
    .createTable('matchmaking_queue')
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('game_type', sql`game_type`, (col) => col.notNull())
    .addColumn('match_type', sql`match_type`, (col) => col.notNull())
    .addColumn('elo', 'integer', (col) => col.notNull())
    .addColumn('rank_tier_id', 'uuid', (col) =>
      col.references('rank_tiers.id').onDelete('set null'),
    )
    .addColumn('preferences', 'jsonb')
    .addColumn('joined_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint('matchmaking_queue_pkey', ['user_id', 'game_type', 'match_type'])
    .execute();

  // Recreate indexes for matchmaking queue
  await db.schema
    .createIndex('matchmaking_queue_game_type_elo_idx')
    .on('matchmaking_queue')
    .columns(['game_type', 'match_type', 'elo'])
    .execute();

  await db.schema
    .createIndex('matchmaking_queue_joined_at_idx')
    .on('matchmaking_queue')
    .column('joined_at')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Remove constraints in reverse order

  // Rebuild matchmaking_queue with UUID id
  await db.schema.dropTable('matchmaking_queue').execute();

  await db.schema
    .createTable('matchmaking_queue')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
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
    .createIndex('matchmaking_queue_game_type_elo_idx')
    .on('matchmaking_queue')
    .columns(['game_type', 'match_type', 'elo'])
    .execute();

  await db.schema
    .createIndex('matchmaking_queue_user_game_match_idx')
    .on('matchmaking_queue')
    .columns(['user_id', 'game_type', 'match_type'])
    .unique()
    .execute();

  await db.schema
    .createIndex('matchmaking_queue_joined_at_idx')
    .on('matchmaking_queue')
    .column('joined_at')
    .execute();

  // Drop sessions index
  await db.schema.dropIndex('sessions_token_hash_idx').execute();

  // Drop unique constraints
  await db.schema
    .alterTable('game_type_configs')
    .dropConstraint('game_type_configs_type_key_unique')
    .execute();

  await db.schema.alterTable('mutes').dropConstraint('mutes_muter_muted_unique').execute();

  await db.schema.alterTable('blocks').dropConstraint('blocks_blocker_blocked_unique').execute();

  await db.schema.alterTable('user_elo').dropConstraint('user_elo_user_game_type_unique').execute();

  // Drop messages index
  await db.schema.dropIndex('messages_conversation_created_idx').execute();

  await db.schema
    .alterTable('conversation_participants')
    .dropConstraint('conversation_participants_conversation_user_unique')
    .execute();
}
