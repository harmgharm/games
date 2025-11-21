import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

import type { FriendshipStatus, TimestampColumns } from './common.js';

// ============================================
// FRIENDSHIPS (Bidirectional - both must accept)
// ============================================

export interface FriendshipsTable extends TimestampColumns {
  id: Generated<string>;
  requester_id: string; // FK -> users (who sent request)
  addressee_id: string; // FK -> users (who received request)
  status: FriendshipStatus;
}

export type Friendship = Selectable<FriendshipsTable>;
export type NewFriendship = Insertable<FriendshipsTable>;
export type FriendshipUpdate = Updateable<FriendshipsTable>;

// ============================================
// BLOCKS
// ============================================

export interface BlocksTable {
  id: Generated<string>;
  blocker_id: string; // FK -> users
  blocked_id: string; // FK -> users
  created_at: Generated<Date>;
}

export type Block = Selectable<BlocksTable>;
export type NewBlock = Insertable<BlocksTable>;

// ============================================
// MUTES (Global - affects chat, matchmaking, visibility)
// ============================================

export interface MutesTable {
  id: Generated<string>;
  muter_id: string; // FK -> users
  muted_id: string; // FK -> users
  created_at: Generated<Date>;
}

export type Mute = Selectable<MutesTable>;
export type NewMute = Insertable<MutesTable>;
