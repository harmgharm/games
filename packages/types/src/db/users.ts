import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

import type { GameType, SoftDeleteColumn, TimestampColumns } from './common';

// ============================================
// USERS
// ============================================

export interface UsersTable extends TimestampColumns, SoftDeleteColumn {
  id: Generated<string>;
  username: string; // unique
  email: string; // unique
  password_hash: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;

  // Auth & security
  email_verified: Generated<boolean>;
  is_verified: Generated<boolean>; // verified badge
  last_login_at: Date | null;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// ============================================
// USER ELO (Separate table for per-game ELO)
// ============================================

export interface UserEloTable {
  id: Generated<string>;
  user_id: string; // FK -> users
  game_type: GameType;
  elo: Generated<number>; // default 1000
  rank_tier_id: string | null; // FK -> rank_tiers
  games_played: Generated<number>;
  wins: Generated<number>;
  losses: Generated<number>;
  win_streak: Generated<number>;
  best_win_streak: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Date | null;
}

export type UserElo = Selectable<UserEloTable>;
export type NewUserElo = Insertable<UserEloTable>;
export type UserEloUpdate = Updateable<UserEloTable>;

// ============================================
// SESSIONS
// ============================================

export interface SessionsTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Generated<Date>;
  revoked_at: Date | null;
}

export type Session = Selectable<SessionsTable>;
export type NewSession = Insertable<SessionsTable>;
export type SessionUpdate = Updateable<SessionsTable>;

// ============================================
// EMAIL TOKENS
// ============================================

export interface EmailTokensTable {
  id: Generated<string>;
  user_id: string; // FK -> users
  token_hash: Buffer;
  code: string;
  type: string; // 'verification' | 'password_reset'
  expires_at: Date;
  used_at: Date | null;
  created_at: Generated<Date>;
}

export type EmailToken = Selectable<EmailTokensTable>;
export type NewEmailToken = Insertable<EmailTokensTable>;
export type EmailTokenUpdate = Updateable<EmailTokensTable>;
