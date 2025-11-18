import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

import type {
  GameSettingsJson,
  GameStatus,
  GameType,
  JsonColumn,
  MatchType,
  TimestampColumns,
} from './common';

// ============================================
// GAMES
// ============================================

export interface GamesTable extends TimestampColumns {
  id: Generated<string>;
  game_type: GameType;
  match_type: MatchType;
  status: GameStatus;
  settings: JsonColumn<GameSettingsJson>;

  // Timing
  started_at: Date | null;
  finished_at: Date | null;

  // Results
  winner_id: string | null; // FK -> users (null if draw or in progress)
}

export type Game = Selectable<GamesTable>;
export type NewGame = Insertable<GamesTable>;
export type GameUpdate = Updateable<GamesTable>;

// ============================================
// GAME PARTICIPANTS
// ============================================

export interface GameParticipantsTable {
  id: Generated<string>;
  game_id: string; // FK -> games
  user_id: string; // FK -> users

  // Results
  score: Generated<number>;
  placement: number | null; // 1st, 2nd, etc.
  elo_before: number | null;
  elo_after: number | null;
  elo_change: number | null;

  joined_at: Generated<Date>;
}

export type GameParticipant = Selectable<GameParticipantsTable>;
export type NewGameParticipant = Insertable<GameParticipantsTable>;
export type GameParticipantUpdate = Updateable<GameParticipantsTable>;

// ============================================
// MATCHMAKING QUEUE
// ============================================

/**
 * Matchmaking queue entry
 * Uses composite primary key (user_id, game_type, match_type)
 * No UUID id - this is ephemeral data optimized for upserts and dequeues
 */
export interface MatchmakingQueueTable {
  user_id: string; // FK -> users, part of composite PK
  game_type: GameType; // Part of composite PK
  match_type: MatchType; // Part of composite PK
  elo: number;
  rank_tier_id: string | null; // FK -> rank_tiers

  // Preferences (JSONB for flexibility)
  preferences: JsonColumn<Record<string, unknown>> | null;

  joined_at: Generated<Date>;
}

export type MatchmakingQueueEntry = Selectable<MatchmakingQueueTable>;
export type NewMatchmakingQueueEntry = Insertable<MatchmakingQueueTable>;
