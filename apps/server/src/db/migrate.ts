import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Database } from '@games/types';
import { FileMigrationProvider, Kysely, Migrator, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const command = process.argv[2];

  try {
    if (command === 'down') {
      const { error, results } = await migrator.migrateDown();

      if (results) {
        for (const result of results) {
          if (result.status === 'Success') {
            console.log(`Migration "${result.migrationName}" rolled back successfully`);
          } else if (result.status === 'Error') {
            console.error(`Failed to rollback migration "${result.migrationName}"`);
          }
        }
      }

      if (error) {
        console.error('Migration rollback failed:', error);
        process.exit(1);
      }
    } else {
      // Default: migrate up
      const { error, results } = await migrator.migrateToLatest();

      if (results) {
        for (const result of results) {
          if (result.status === 'Success') {
            console.log(`Migration "${result.migrationName}" executed successfully`);
          } else if (result.status === 'Error') {
            console.error(`Failed to execute migration "${result.migrationName}"`);
          }
        }
      }

      if (error) {
        console.error('Migration failed:', error);
        process.exit(1);
      }

      if (!results || results.length === 0) {
        console.log('No migrations to run');
      }
    }
  } finally {
    await db.destroy();
  }
}

runMigrations().catch((err) => {
  console.error('Migration script error:', err);
  process.exit(1);
});
