import type { Generated, Insertable, Selectable } from 'kysely';

// ============================================
// NOTIFICATION TABLES (Separate per type)
// Using bigint sequential IDs for high-volume writes
// ============================================

// ============================================
// GAME INVITE NOTIFICATIONS
// ============================================

export interface GameInviteNotificationsTable {
  id: Generated<number>; // bigserial
  user_id: string; // recipient
  actor_id: string; // who invited
  game_id: string;
  is_read: Generated<boolean>;
  created_at: Generated<Date>;
}

export type GameInviteNotification = Selectable<GameInviteNotificationsTable>;
export type NewGameInviteNotification = Insertable<GameInviteNotificationsTable>;

// ============================================
// FRIEND REQUEST NOTIFICATIONS
// ============================================

export interface FriendRequestNotificationsTable {
  id: Generated<number>;
  user_id: string; // recipient
  actor_id: string; // who sent request
  friendship_id: string;
  is_read: Generated<boolean>;
  created_at: Generated<Date>;
}

export type FriendRequestNotification = Selectable<FriendRequestNotificationsTable>;
export type NewFriendRequestNotification = Insertable<FriendRequestNotificationsTable>;

// ============================================
// MATCH FOUND NOTIFICATIONS
// ============================================

export interface MatchFoundNotificationsTable {
  id: Generated<number>;
  user_id: string; // recipient
  game_id: string;
  is_read: Generated<boolean>;
  created_at: Generated<Date>;
}

export type MatchFoundNotification = Selectable<MatchFoundNotificationsTable>;
export type NewMatchFoundNotification = Insertable<MatchFoundNotificationsTable>;

// ============================================
// MESSAGE NOTIFICATIONS
// ============================================

export interface MessageNotificationsTable {
  id: Generated<number>;
  user_id: string; // recipient
  actor_id: string; // who sent message
  conversation_id: string;
  message_id: string;
  is_read: Generated<boolean>;
  created_at: Generated<Date>;
}

export type MessageNotification = Selectable<MessageNotificationsTable>;
export type NewMessageNotification = Insertable<MessageNotificationsTable>;

// ============================================
// GAME RESULT NOTIFICATIONS
// ============================================

export interface GameResultNotificationsTable {
  id: Generated<number>;
  user_id: string; // recipient
  game_id: string;
  is_read: Generated<boolean>;
  created_at: Generated<Date>;
}

export type GameResultNotification = Selectable<GameResultNotificationsTable>;
export type NewGameResultNotification = Insertable<GameResultNotificationsTable>;
