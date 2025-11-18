/**
 * Seed Runner CLI
 *
 * Usage:
 *   pnpm db:seed        - Run all seeds
 *   pnpm db:seed:reset  - Reset and reseed
 */

import { closeDatabase, db } from './client';
import { resetAndSeed, runSeeds } from './seeds';

/**
 * Main CLI handler
 */
async function main(): Promise<void> {
  const command = process.argv[2] ?? 'run';

  try {
    switch (command) {
      case 'run': {
        await runSeeds(db);
        break;
      }
      case 'reset': {
        await resetAndSeed(db);
        break;
      }
      default: {
        console.error(`Unknown command: ${command}`);
        console.error('Usage: seed [run|reset]');
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

void main();
