/**
 * Migration Runner CLI
 *
 * Usage:
 *   pnpm db:migrate          - Run all pending migrations
 *   pnpm db:migrate:down     - Rollback last migration
 *   pnpm db:migrate:status   - Show migration status
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FileMigrationProvider, Migrator } from 'kysely';

import { closeDatabase, db } from './client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create migrator instance
 */
const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, 'migrations'),
  }),
});

/**
 * Run all pending migrations
 */
async function migrateToLatest(): Promise<void> {
  console.log('🚀 Running migrations...\n');

  const { error, results } = await migrator.migrateToLatest();

  if (results === undefined || results.length === 0) {
    console.log('✅ No pending migrations\n');
  } else {
    for (const result of results) {
      if (result.status === 'Success') {
        console.log(`  ✅ ${result.migrationName}`);
      } else if (result.status === 'Error') {
        console.error(`  ❌ ${result.migrationName}`);
      }
    }

    console.log('');
  }

  if (error !== undefined) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  }
}

/**
 * Rollback the last migration
 */
async function migrateDown(): Promise<void> {
  console.log('⬇️  Rolling back last migration...\n');

  const { error, results } = await migrator.migrateDown();

  if (results === undefined || results.length === 0) {
    console.log('✅ No migrations to rollback\n');
  } else {
    for (const result of results) {
      if (result.status === 'Success') {
        console.log(`  ⬇️  ${result.migrationName}`);
      } else if (result.status === 'Error') {
        console.error(`  ❌ ${result.migrationName}`);
      }
    }

    console.log('');
  }

  if (error !== undefined) {
    console.error('Rollback failed:', error);
    process.exitCode = 1;
  }
}

/**
 * Show migration status
 */
async function showStatus(): Promise<void> {
  console.log('📋 Migration status:\n');

  const migrations = await migrator.getMigrations();

  for (const migration of migrations) {
    const status = migration.executedAt === undefined ? '⏳' : '✅';
    const date =
      migration.executedAt === undefined
        ? ' (pending)'
        : ` (${migration.executedAt.toISOString()})`;

    console.log(`  ${status} ${migration.name}${date}`);
  }

  console.log('');
}

/**
 * Main CLI handler
 */
async function main(): Promise<void> {
  const command = process.argv[2] ?? 'latest';

  try {
    switch (command) {
      case 'latest':
      case 'up': {
        await migrateToLatest();
        break;
      }
      case 'down': {
        await migrateDown();
        break;
      }
      case 'status': {
        await showStatus();
        break;
      }
      default: {
        console.error(`Unknown command: ${command}`);
        console.error('Usage: migrate [latest|down|status]');
        process.exitCode = 1;
      }
    }
  } finally {
    await closeDatabase();
  }
}

void main();
