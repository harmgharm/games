/**
 * Database types for Kysely
 * Split by domain for maintainability
 */

// Common types and enums
export * from './common';

// Lookup tables
export * from './lookup';

// Domain tables
export * from './users';
export * from './games';
export * from './social';
export * from './chat';
export * from './notifications';

// Import table types for Database interface
import type { RankTiersTable, GameTypeConfigsTable } from './lookup';
import type { UsersTable, UserEloTable, SessionsTable } from './users';
import type { GamesTable, GameParticipantsTable, MatchmakingQueueTable } from './games';
import type { FriendshipsTable, BlocksTable, MutesTable } from './social';
import type { ConversationsTable, ConversationParticipantsTable, MessagesTable } from './chat';
import type {
  GameInviteNotificationsTable,
  FriendRequestNotificationsTable,
  MatchFoundNotificationsTable,
  MessageNotificationsTable,
  GameResultNotificationsTable,
} from './notifications';

// ============================================
// DATABASE INTERFACE
// ============================================

export interface Database {
  // Lookup tables
  rank_tiers: RankTiersTable;
  game_type_configs: GameTypeConfigsTable;

  // Users
  users: UsersTable;
  user_elo: UserEloTable;
  sessions: SessionsTable;

  // Games
  games: GamesTable;
  game_participants: GameParticipantsTable;
  matchmaking_queue: MatchmakingQueueTable;

  // Social
  friendships: FriendshipsTable;
  blocks: BlocksTable;
  mutes: MutesTable;

  // Chat
  conversations: ConversationsTable;
  conversation_participants: ConversationParticipantsTable;
  messages: MessagesTable;

  // Notifications
  game_invite_notifications: GameInviteNotificationsTable;
  friend_request_notifications: FriendRequestNotificationsTable;
  match_found_notifications: MatchFoundNotificationsTable;
  message_notifications: MessageNotificationsTable;
  game_result_notifications: GameResultNotificationsTable;
}
