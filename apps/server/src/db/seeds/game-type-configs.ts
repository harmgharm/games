/**
 * Seed: Game Type Configs
 *
 * Default game settings for each game type.
 * These define what settings are available and their validation rules.
 */

import type { Database, GameType, SettingValidationJson } from '@games/types';
import type { Kysely } from 'kysely';

export interface GameTypeConfigSeed {
  game_type: GameType;
  setting_key: string;
  display_name: string;
  description: string | null;
  default_value: string;
  validation: SettingValidationJson;
  display_order: number;
}

/**
 * Default game type configurations
 */
export const defaultGameTypeConfigs: GameTypeConfigSeed[] = [
  // Trivia game settings
  {
    game_type: 'trivia',
    setting_key: 'time_limit',
    display_name: 'Time Limit',
    description: 'Time limit per question in seconds',
    default_value: '30',
    validation: {
      type: 'number',
      min: 10,
      max: 120,
    },
    display_order: 1,
  },
  {
    game_type: 'trivia',
    setting_key: 'rounds',
    display_name: 'Number of Rounds',
    description: 'Total number of questions',
    default_value: '10',
    validation: {
      type: 'number',
      min: 5,
      max: 50,
    },
    display_order: 2,
  },
  {
    game_type: 'trivia',
    setting_key: 'difficulty',
    display_name: 'Difficulty',
    description: 'Question difficulty level',
    default_value: 'medium',
    validation: {
      type: 'string',
      enum: ['easy', 'medium', 'hard'],
    },
    display_order: 3,
  },

  // Word game settings
  {
    game_type: 'word',
    setting_key: 'time_limit',
    display_name: 'Time Limit',
    description: 'Time limit per round in seconds',
    default_value: '60',
    validation: {
      type: 'number',
      min: 30,
      max: 180,
    },
    display_order: 1,
  },
  {
    game_type: 'word',
    setting_key: 'word_length',
    display_name: 'Word Length',
    description: 'Number of letters in the word',
    default_value: '5',
    validation: {
      type: 'number',
      min: 4,
      max: 8,
    },
    display_order: 2,
  },
  {
    game_type: 'word',
    setting_key: 'max_attempts',
    display_name: 'Max Attempts',
    description: 'Maximum number of guesses allowed',
    default_value: '6',
    validation: {
      type: 'number',
      min: 4,
      max: 10,
    },
    display_order: 3,
  },
];

/**
 * Seed game type configs into the database
 */
export async function seedGameTypeConfigs(db: Kysely<Database>): Promise<void> {
  const existing = await db.selectFrom('game_type_configs').select('id').limit(1).execute();

  if (existing.length > 0) {
    // eslint-disable-next-line no-console
    console.log('  ⏭️  Game type configs already seeded, skipping');
    return;
  }

  // Convert validation objects to JSON strings for insertion
  const values = defaultGameTypeConfigs.map((config) => ({
    ...config,
    validation: JSON.stringify(config.validation),
  }));

  await db.insertInto('game_type_configs').values(values).execute();

  // eslint-disable-next-line no-console
  console.log(`  ✅ Seeded ${String(defaultGameTypeConfigs.length)} game type configs`);
}
