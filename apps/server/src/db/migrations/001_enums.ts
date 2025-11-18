import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // pgcrypto for gen_random_uuid()
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`.execute(db);

  // Game enums
  await db.schema.createType('game_type').asEnum(['trivia', 'word']).execute();

  await db.schema
    .createType('game_status')
    .asEnum(['waiting', 'in_progress', 'completed', 'cancelled'])
    .execute();

  await db.schema.createType('match_type').asEnum(['casual', 'ranked']).execute();

  // Social enums
  await db.schema.createType('friendship_status').asEnum(['pending', 'accepted']).execute();

  // Chat enums
  await db.schema.createType('message_type').asEnum(['direct', 'game']).execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropType('message_type').execute();
  await db.schema.dropType('friendship_status').execute();
  await db.schema.dropType('match_type').execute();
  await db.schema.dropType('game_status').execute();
  await db.schema.dropType('game_type').execute();
  // pgcrypto left in place (safe to keep)
}
