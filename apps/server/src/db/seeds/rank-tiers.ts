/**
 * Seed: Rank Tiers
 *
 * Initial rank tiers for the ELO-based ranking system.
 * These can be modified in production without a migration.
 */

import type { Database } from '@games/types';
import { createLogger } from '@games/utils';
import type { Kysely } from 'kysely';

const log = createLogger('Seed:RankTiers');

export interface RankTierSeed {
  name: string;
  min_elo: number;
  max_elo: number | null;
  color: string;
  display_order: number;
}

/**
 * Default rank tiers - Bronze, Silver, Gold
 */
export const defaultRankTiers: RankTierSeed[] = [
  {
    name: 'Bronze',
    min_elo: 0,
    max_elo: 1199,
    color: '#CD7F32',
    display_order: 1,
  },
  {
    name: 'Silver',
    min_elo: 1200,
    max_elo: 1499,
    color: '#C0C0C0',
    display_order: 2,
  },
  {
    name: 'Gold',
    min_elo: 1500,
    max_elo: null, // No upper limit for top tier
    color: '#FFD700',
    display_order: 3,
  },
];

/**
 * Seed rank tiers into the database
 */
export async function seedRankTiers(db: Kysely<Database>): Promise<void> {
  const existing = await db.selectFrom('rank_tiers').select('id').limit(1).execute();

  if (existing.length > 0) {
    log.info('  ⏭️  Rank tiers already seeded, skipping');
    return;
  }

  await db.insertInto('rank_tiers').values(defaultRankTiers).execute();

  log.info(`  ✅ Seeded ${String(defaultRankTiers.length)} rank tiers`);
}
