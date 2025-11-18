import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

/**
 * Database schema types for Kysely
 * These types define the structure of all database tables
 */

// =============================================================================
// Common Types
// =============================================================================

/**
 * Timestamp columns that all tables should have
 */
export interface TimestampColumns {
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

/**
 * Soft delete column for recoverable data
 */
export interface SoftDeleteColumn {
  deleted_at: Date | null;
}

// =============================================================================
// Users
// =============================================================================

export interface UsersTable extends TimestampColumns, SoftDeleteColumn {
  id: Generated<string>;
  email: string;
  username: string;
  password_hash: string;
  avatar_url: string | null;
  is_verified: Generated<boolean>;
  last_login_at: Date | null;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// =============================================================================
// Sessions
// =============================================================================

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

// =============================================================================
// Friendships
// =============================================================================

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface FriendshipsTable extends TimestampColumns {
  id: Generated<string>;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
}

export type Friendship = Selectable<FriendshipsTable>;
export type NewFriendship = Insertable<FriendshipsTable>;
export type FriendshipUpdate = Updateable<FriendshipsTable>;

// =============================================================================
// Games / Duels
// =============================================================================

export type GameType = 'trivia' | 'word' | 'card' | 'board';
export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled';

export interface GamesTable extends TimestampColumns {
  id: Generated<string>;
  type: GameType;
  status: GameStatus;
  settings: unknown; // JSONB
  finished_at: Date | null;
}

export type Game = Selectable<GamesTable>;
export type NewGame = Insertable<GamesTable>;
export type GameUpdate = Updateable<GamesTable>;

// =============================================================================
// Game Participants
// =============================================================================

export interface GameParticipantsTable {
  id: Generated<string>;
  game_id: string;
  user_id: string;
  score: Generated<number>;
  placement: number | null;
  joined_at: Generated<Date>;
}

export type GameParticipant = Selectable<GameParticipantsTable>;
export type NewGameParticipant = Insertable<GameParticipantsTable>;
export type GameParticipantUpdate = Updateable<GameParticipantsTable>;

// =============================================================================
// Conversations
// =============================================================================

export type ConversationType = 'direct' | 'group';

export interface ConversationsTable extends TimestampColumns {
  id: Generated<string>;
  type: ConversationType;
  name: string | null;
}

export type Conversation = Selectable<ConversationsTable>;
export type NewConversation = Insertable<ConversationsTable>;
export type ConversationUpdate = Updateable<ConversationsTable>;

// =============================================================================
// Conversation Members
// =============================================================================

export interface ConversationMembersTable {
  id: Generated<string>;
  conversation_id: string;
  user_id: string;
  joined_at: Generated<Date>;
  left_at: Date | null;
}

export type ConversationMember = Selectable<ConversationMembersTable>;
export type NewConversationMember = Insertable<ConversationMembersTable>;
export type ConversationMemberUpdate = Updateable<ConversationMembersTable>;

// =============================================================================
// Messages
// =============================================================================

export interface MessagesTable extends TimestampColumns, SoftDeleteColumn {
  id: Generated<string>;
  conversation_id: string;
  user_id: string;
  content: string;
}

export type Message = Selectable<MessagesTable>;
export type NewMessage = Insertable<MessagesTable>;
export type MessageUpdate = Updateable<MessagesTable>;

// =============================================================================
// Matchmaking Queue
// =============================================================================

export interface MatchmakingQueueTable {
  id: Generated<string>;
  user_id: string;
  game_type: GameType;
  elo: number;
  joined_at: Generated<Date>;
}

export type MatchmakingQueueEntry = Selectable<MatchmakingQueueTable>;
export type NewMatchmakingQueueEntry = Insertable<MatchmakingQueueTable>;

// =============================================================================
// Database Schema
// =============================================================================

/**
 * Complete database schema interface
 * Used by Kysely for type-safe queries
 */
export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  friendships: FriendshipsTable;
  games: GamesTable;
  game_participants: GameParticipantsTable;
  conversations: ConversationsTable;
  conversation_members: ConversationMembersTable;
  messages: MessagesTable;
  matchmaking_queue: MatchmakingQueueTable;
}
