/**
 * Database seed runner
 *
 * Usage:
 *   pnpm seed        - Run all seeds
 *   pnpm seed:reset  - Reset and reseed
 */

import type { Database } from '@games/types';
import type { Kysely } from 'kysely';

import { seedGameTypeConfigs } from './game-type-configs';
import { seedRankTiers } from './rank-tiers';

/**
 * Run all seeds in order
 */
export async function runSeeds(db: Kysely<Database>): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🌱 Running seeds...');

  await seedRankTiers(db);
  await seedGameTypeConfigs(db);

  // eslint-disable-next-line no-console
  console.log('✅ Seeds completed');
}

/**
 * Reset tables and reseed
 */
export async function resetAndSeed(db: Kysely<Database>): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🔄 Resetting and reseeding...');

  // Clear existing data (in dependency order)
  await db.deleteFrom('game_type_configs').execute();
  await db.deleteFrom('rank_tiers').execute();

  await runSeeds(db);
}
