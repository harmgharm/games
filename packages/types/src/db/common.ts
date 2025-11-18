import type { ColumnType, Generated } from 'kysely';

// ============================================
// ENUMS
// ============================================

export type GameType = 'trivia' | 'word';
export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled';
export type MatchType = 'casual' | 'ranked';
export type FriendshipStatus = 'pending' | 'accepted';
export type MessageType = 'direct' | 'game';

// ============================================
// COMMON COLUMN PATTERNS
// ============================================

/**
 * Standard timestamp columns for audit trail
 */
export interface TimestampColumns {
  created_at: Generated<Date>;
  updated_at: Date | null;
}

/**
 * Soft delete column for recoverable data
 */
export interface SoftDeleteColumn {
  deleted_at: Date | null;
}

// ============================================
// JSONB TYPE HELPERS
// ============================================

/**
 * Game settings stored as JSONB
 * Flexible structure per game type
 */
export interface GameSettingsJson {
  timeLimit?: number;
  maxPlayers?: number;
  difficulty?: string;
  rounds?: number;
  categories?: string[];
  customRules?: Record<string, unknown>;
}

/**
 * Setting validation rules for game configs
 */
export interface SettingValidationJson {
  type: 'number' | 'string' | 'boolean' | 'array';
  min?: number;
  max?: number;
  enum?: string[];
  required?: boolean;
}

/**
 * ColumnType helper for JSONB fields
 * Select returns typed object, Insert/Update takes string or object
 */
export type JsonColumn<T> = ColumnType<T, string | T, string | T>;
