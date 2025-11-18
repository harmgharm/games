/**
 * Match History Queries
 *
 * Queries for fetching game history and statistics.
 */

import type { Database, GameType } from '@games/types';
import type { Kysely } from 'kysely';

export interface MatchHistoryEntry {
  game_id: string;
  game_type: GameType;
  match_type: 'casual' | 'ranked';
  status: string;
  started_at: Date | null;
  finished_at: Date | null;
  user_score: number;
  user_placement: number | null;
  user_elo_change: number | null;
  opponent_id: string;
  opponent_username: string;
  opponent_display_name: string | null;
  opponent_score: number;
}

export interface MatchHistoryOptions {
  userId: string;
  gameType?: GameType;
  limit?: number;
  offset?: number;
}

/**
 * Get match history for a user
 */
export async function getMatchHistory(
  db: Kysely<Database>,
  options: MatchHistoryOptions,
): Promise<MatchHistoryEntry[]> {
  const { userId, gameType, limit = 20, offset = 0 } = options;

  let query = db
    .selectFrom('game_participants as user_participant')
    .innerJoin('games', 'games.id', 'user_participant.game_id')
    .innerJoin('game_participants as opponent_participant', (join) =>
      join
        .onRef('opponent_participant.game_id', '=', 'user_participant.game_id')
        .onRef('opponent_participant.user_id', '!=', 'user_participant.user_id'),
    )
    .innerJoin('users as opponent', 'opponent.id', 'opponent_participant.user_id')
    .select([
      'games.id as game_id',
      'games.game_type',
      'games.match_type',
      'games.status',
      'games.started_at',
      'games.finished_at',
      'user_participant.score as user_score',
      'user_participant.placement as user_placement',
      'user_participant.elo_change as user_elo_change',
      'opponent.id as opponent_id',
      'opponent.username as opponent_username',
      'opponent.display_name as opponent_display_name',
      'opponent_participant.score as opponent_score',
    ])
    .where('user_participant.user_id', '=', userId)
    .where('games.status', '=', 'completed');

  if (gameType !== undefined) {
    query = query.where('games.game_type', '=', gameType);
  }

  const results = await query
    .orderBy('games.finished_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

  return results;
}

export interface MatchHistoryWithFriendOptions {
  userId: string;
  friendId: string;
  limit?: number;
}

/**
 * Get match history between two specific users
 */
export async function getMatchHistoryWithFriend(
  db: Kysely<Database>,
  options: MatchHistoryWithFriendOptions,
): Promise<MatchHistoryEntry[]> {
  const { userId, friendId, limit = 10 } = options;

  const results = await db
    .selectFrom('game_participants as user_participant')
    .innerJoin('games', 'games.id', 'user_participant.game_id')
    .innerJoin('game_participants as friend_participant', (join) =>
      join
        .onRef('friend_participant.game_id', '=', 'user_participant.game_id')
        .on('friend_participant.user_id', '=', friendId),
    )
    .innerJoin('users as friend', 'friend.id', 'friend_participant.user_id')
    .select([
      'games.id as game_id',
      'games.game_type',
      'games.match_type',
      'games.status',
      'games.started_at',
      'games.finished_at',
      'user_participant.score as user_score',
      'user_participant.placement as user_placement',
      'user_participant.elo_change as user_elo_change',
      'friend.id as opponent_id',
      'friend.username as opponent_username',
      'friend.display_name as opponent_display_name',
      'friend_participant.score as opponent_score',
    ])
    .where('user_participant.user_id', '=', userId)
    .where('games.status', '=', 'completed')
    .orderBy('games.finished_at', 'desc')
    .limit(limit)
    .execute();

  return results;
}
