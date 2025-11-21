/**
 * Database types for Kysely
 * Split by domain for maintainability
 */

// Common types and enums
export * from './common.js';

// Lookup tables
export * from './lookup.js';

// Domain tables
export * from './users.js';
export * from './games.js';
export * from './social.js';
export * from './chat.js';
export * from './notifications.js';

// Import table types for Database interface
import type { RankTiersTable, GameTypeConfigsTable } from './lookup.js';
import type {
  UsersTable,
  UserEloTable,
  SessionsTable,
  EmailTokensTable,
  ReservedUsernamesTable,
} from './users.js';
import type { GamesTable, GameParticipantsTable, MatchmakingQueueTable } from './games.js';
import type { FriendshipsTable, BlocksTable, MutesTable } from './social.js';
import type { ConversationsTable, ConversationParticipantsTable, MessagesTable } from './chat.js';
import type {
  GameInviteNotificationsTable,
  FriendRequestNotificationsTable,
  MatchFoundNotificationsTable,
  MessageNotificationsTable,
  GameResultNotificationsTable,
} from './notifications.js';

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
  email_tokens: EmailTokensTable;
  reserved_usernames: ReservedUsernamesTable;

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
