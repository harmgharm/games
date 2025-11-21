/**
 * Database seed runner
 *
 * Usage:
 *   pnpm seed        - Run all seeds
 *   pnpm seed:reset  - Reset and reseed
 */

import type { Database } from '@games/types';
import { createLogger } from '@games/utils';
import type { Kysely } from 'kysely';

import { seedGameTypeConfigs } from './game-type-configs.js';
import { seedRankTiers } from './rank-tiers.js';

const log = createLogger('Seed');

/**
 * Run all seeds in order
 */
export async function runSeeds(db: Kysely<Database>): Promise<void> {
  log.info('🌱 Running seeds...');

  await seedRankTiers(db);
  await seedGameTypeConfigs(db);

  log.info('✅ Seeds completed');
}

/**
 * Reset tables and reseed
 */
export async function resetAndSeed(db: Kysely<Database>): Promise<void> {
  log.info('🔄 Resetting and reseeding...');

  // Clear existing data (in dependency order)
  await db.deleteFrom('game_type_configs').execute();
  await db.deleteFrom('rank_tiers').execute();

  await runSeeds(db);
}
