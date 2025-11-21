import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

import type { GameType, SoftDeleteColumn, TimestampColumns, UserStatus } from './common';

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
  identity_verified: Generated<boolean>; // checkmark verification for notable accounts
  last_login_at: Date | null;
  last_login_ip: string | null;
  login_count: Generated<number>;
  locked_until: Date | null;

  // Account status & privacy
  status: Generated<UserStatus>;
  is_public: Generated<boolean>;
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

// ============================================
// RESERVED USERNAMES
// ============================================

export interface ReservedUsernamesTable {
  id: Generated<string>;
  username: string; // unique - the original username being held
  user_id: string; // FK -> users
  original_email_hash: Buffer; // SHA-256 hash for recovery verification
  reserved_until: Date; // expiry date (deletion + 30 days)
  created_at: Generated<Date>;
}

export type ReservedUsername = Selectable<ReservedUsernamesTable>;
export type NewReservedUsername = Insertable<ReservedUsernamesTable>;
export type ReservedUsernameUpdate = Updateable<ReservedUsernamesTable>;
