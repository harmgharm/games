import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Conversations
  await db.schema
    .createTable('conversations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('is_group', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('group_name', 'varchar(100)')
    .addColumn('last_message_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // Conversation participants
  await db.schema
    .createTable('conversation_participants')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('conversation_id', 'uuid', (col) =>
      col.notNull().references('conversations.id').onDelete('cascade'),
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('joined_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('last_read_at', 'timestamptz')
    .addColumn('left_at', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('conversation_participants_unique_idx')
    .on('conversation_participants')
    .unique()
    .columns(['conversation_id', 'user_id'])
    .execute();

  await db.schema
    .createIndex('conversation_participants_user_idx')
    .on('conversation_participants')
    .column('user_id')
    .execute();

  // Messages
  await db.schema
    .createTable('messages')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('conversation_id', 'uuid', (col) =>
      col.notNull().references('conversations.id').onDelete('cascade'),
    )
    .addColumn('sender_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('message_type', sql`message_type`, (col) => col.notNull().defaultTo('direct'))
    .addColumn('game_id', 'uuid', (col) => col.references('games.id').onDelete('set null'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz')
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('messages_conversation_idx')
    .on('messages')
    .columns(['conversation_id', 'created_at'])
    .execute();

  await db.schema.createIndex('messages_sender_idx').on('messages').column('sender_id').execute();
  await db.schema.createIndex('messages_game_idx').on('messages').column('game_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('messages_game_idx').ifExists().execute();
  await db.schema.dropIndex('messages_sender_idx').ifExists().execute();
  await db.schema.dropIndex('messages_conversation_idx').ifExists().execute();
  await db.schema.dropTable('messages').ifExists().execute();

  await db.schema.dropIndex('conversation_participants_user_idx').ifExists().execute();
  await db.schema.dropIndex('conversation_participants_unique_idx').ifExists().execute();
  await db.schema.dropTable('conversation_participants').ifExists().execute();

  await db.schema.dropTable('conversations').ifExists().execute();
}
