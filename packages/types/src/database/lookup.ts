import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

import type { GameType, JsonColumn, SettingValidationJson } from './common';

// ============================================
// RANK TIERS (Lookup table for flexibility)
// ============================================

export interface RankTiersTable {
  id: Generated<string>;
  name: string; // 'Bronze', 'Silver', 'Gold'
  min_elo: number;
  max_elo: number | null; // null for highest tier
  icon_url: string | null;
  color: string | null; // hex color for UI
  display_order: number;
  created_at: Generated<Date>;
}

export type RankTier = Selectable<RankTiersTable>;
export type NewRankTier = Insertable<RankTiersTable>;
export type RankTierUpdate = Updateable<RankTiersTable>;

// ============================================
// GAME TYPE CONFIGS (Settings per game type)
// ============================================

export interface GameTypeConfigsTable {
  id: Generated<string>;
  game_type: GameType;
  setting_key: string; // 'timeLimit', 'rounds', etc.
  display_name: string;
  description: string | null;
  default_value: string; // JSON string
  validation: JsonColumn<SettingValidationJson>;
  display_order: number;
  created_at: Generated<Date>;
}

export type GameTypeConfig = Selectable<GameTypeConfigsTable>;
export type NewGameTypeConfig = Insertable<GameTypeConfigsTable>;
export type GameTypeConfigUpdate = Updateable<GameTypeConfigsTable>;
