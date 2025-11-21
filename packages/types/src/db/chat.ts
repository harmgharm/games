import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

import type { MessageType, SoftDeleteColumn, TimestampColumns } from './common.js';

// ============================================
// CONVERSATIONS
// ============================================

export interface ConversationsTable {
  id: Generated<string>;
  is_group: Generated<boolean>;
  group_name: string | null;
  last_message_at: Date | null;
  created_at: Generated<Date>;
}

export type Conversation = Selectable<ConversationsTable>;
export type NewConversation = Insertable<ConversationsTable>;
export type ConversationUpdate = Updateable<ConversationsTable>;

// ============================================
// CONVERSATION PARTICIPANTS
// ============================================

export interface ConversationParticipantsTable {
  id: Generated<string>;
  conversation_id: string; // FK -> conversations
  user_id: string; // FK -> users
  joined_at: Generated<Date>;
  last_read_at: Date | null;
  left_at: Date | null;
}

export type ConversationParticipant = Selectable<ConversationParticipantsTable>;
export type NewConversationParticipant = Insertable<ConversationParticipantsTable>;
export type ConversationParticipantUpdate = Updateable<ConversationParticipantsTable>;

// ============================================
// MESSAGES
// ============================================

export interface MessagesTable extends TimestampColumns, SoftDeleteColumn {
  id: Generated<string>;
  conversation_id: string; // FK -> conversations
  sender_id: string; // FK -> users

  // Content
  content: string;

  // Message context
  message_type: MessageType;
  game_id: string | null; // FK -> games (for in-match chat)
}

export type Message = Selectable<MessagesTable>;
export type NewMessage = Insertable<MessagesTable>;
export type MessageUpdate = Updateable<MessagesTable>;
