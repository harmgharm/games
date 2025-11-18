import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Friendships (bidirectional - both must accept)
  await db.schema
    .createTable('friendships')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('requester_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('addressee_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('status', sql`friendship_status`, (col) => col.notNull().defaultTo('pending'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz')
    .execute();

  // One friendship per pair
  await db.schema
    .createIndex('friendships_unique_idx')
    .on('friendships')
    .unique()
    .columns(['requester_id', 'addressee_id'])
    .execute();

  await db.schema
    .createIndex('friendships_requester_idx')
    .on('friendships')
    .column('requester_id')
    .execute();
  await db.schema
    .createIndex('friendships_addressee_idx')
    .on('friendships')
    .column('addressee_id')
    .execute();

  // Blocks
  await db.schema
    .createTable('blocks')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('blocker_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('blocked_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('blocks_unique_idx')
    .on('blocks')
    .unique()
    .columns(['blocker_id', 'blocked_id'])
    .execute();

  // Mutes (global - affects chat, matchmaking, visibility)
  await db.schema
    .createTable('mutes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('muter_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('muted_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('mutes_unique_idx')
    .on('mutes')
    .unique()
    .columns(['muter_id', 'muted_id'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('mutes_unique_idx').ifExists().execute();
  await db.schema.dropTable('mutes').ifExists().execute();

  await db.schema.dropIndex('blocks_unique_idx').ifExists().execute();
  await db.schema.dropTable('blocks').ifExists().execute();

  await db.schema.dropIndex('friendships_addressee_idx').ifExists().execute();
  await db.schema.dropIndex('friendships_requester_idx').ifExists().execute();
  await db.schema.dropIndex('friendships_unique_idx').ifExists().execute();
  await db.schema.dropTable('friendships').ifExists().execute();
}
