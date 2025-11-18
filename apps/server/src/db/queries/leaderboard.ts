/**
 * Leaderboard Queries
 *
 * Queries for fetching leaderboard data with rankings.
 */

import type { Database, GameType } from '@games/types';
import type { Kysely } from 'kysely';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  elo: number;
  rank_tier_name: string | null;
  rank_tier_color: string | null;
  games_played: number;
  wins: number;
  win_rate: number;
  rank_position: number;
}

export interface LeaderboardOptions {
  gameType: GameType;
  limit?: number;
  offset?: number;
}

/**
 * Get global leaderboard for a game type
 */
export async function getLeaderboard(
  db: Kysely<Database>,
  options: LeaderboardOptions,
): Promise<LeaderboardEntry[]> {
  const { gameType, limit = 50, offset = 0 } = options;

  const results = await db
    .selectFrom('user_elo')
    .innerJoin('users', 'users.id', 'user_elo.user_id')
    .leftJoin('rank_tiers', 'rank_tiers.id', 'user_elo.rank_tier_id')
    .select([
      'users.id as user_id',
      'users.username',
      'users.display_name',
      'users.avatar_url',
      'user_elo.elo',
      'rank_tiers.name as rank_tier_name',
      'rank_tiers.color as rank_tier_color',
      'user_elo.games_played',
      'user_elo.wins',
    ])
    .where('user_elo.game_type', '=', gameType)
    .where('users.deleted_at', 'is', null)
    .orderBy('user_elo.elo', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

  return results.map((row, index) => ({
    ...row,
    win_rate: row.games_played > 0 ? (row.wins / row.games_played) * 100 : 0,
    rank_position: offset + index + 1,
  }));
}

/**
 * Get a user's rank position in the leaderboard
 */
export async function getUserRankPosition(
  db: Kysely<Database>,
  userId: string,
  gameType: GameType,
): Promise<number | null> {
  const userElo = await db
    .selectFrom('user_elo')
    .select('elo')
    .where('user_id', '=', userId)
    .where('game_type', '=', gameType)
    .executeTakeFirst();

  if (userElo === undefined) {
    return null;
  }

  const result = await db
    .selectFrom('user_elo')
    .innerJoin('users', 'users.id', 'user_elo.user_id')
    .select(({ fn }) => [fn.countAll<number>().as('count')])
    .where('user_elo.game_type', '=', gameType)
    .where('user_elo.elo', '>', userElo.elo)
    .where('users.deleted_at', 'is', null)
    .executeTakeFirst();

  return (result?.count ?? 0) + 1;
}
