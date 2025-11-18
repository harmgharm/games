import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Rank tiers - lookup table for flexible rank management
  await db.schema
    .createTable('rank_tiers')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('min_elo', 'integer', (col) => col.notNull())
    .addColumn('max_elo', 'integer') // null for highest tier
    .addColumn('icon_url', 'text')
    .addColumn('color', 'varchar(7)') // hex color
    .addColumn('display_order', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('rank_tiers_display_order_idx')
    .on('rank_tiers')
    .column('display_order')
    .execute();

  // Game type configs - settings definitions per game type
  await db.schema
    .createTable('game_type_configs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('game_type', sql`game_type`, (col) => col.notNull())
    .addColumn('setting_key', 'varchar(100)', (col) => col.notNull())
    .addColumn('display_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('default_value', 'text', (col) => col.notNull()) // JSON string
    .addColumn('validation', 'jsonb', (col) => col.notNull())
    .addColumn('display_order', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // Unique setting per game type
  await db.schema
    .createIndex('game_type_configs_unique_idx')
    .on('game_type_configs')
    .unique()
    .columns(['game_type', 'setting_key'])
    .execute();

  // Note: Seed data is in /db/seeds/ - run `pnpm seed` after migrations
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('game_type_configs_unique_idx').ifExists().execute();
  await db.schema.dropTable('game_type_configs').ifExists().execute();

  await db.schema.dropIndex('rank_tiers_display_order_idx').ifExists().execute();
  await db.schema.dropTable('rank_tiers').ifExists().execute();
}
