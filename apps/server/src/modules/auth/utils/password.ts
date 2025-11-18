/**
 * Password Utilities
 *
 * Argon2id hashing and zxcvbn strength checking.
 */

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';
import argon2 from 'argon2';

// Configure zxcvbn with English and common dictionaries
const options = {
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
};

zxcvbnOptions.setOptions(options);

/**
 * Argon2id configuration
 * Based on OWASP recommendations
 */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65_536, // 64 MB
  timeCost: 3, // iterations
  parallelism: 4, // threads
};

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
  score: number; // 0-4
  isStrong: boolean;
  feedback: {
    warning: string;
    suggestions: string[];
  };
}

/**
 * Check password strength using zxcvbn
 *
 * @param password - Password to check
 * @param userInputs - User-specific inputs to penalize (email, username)
 * @returns Strength result with score and feedback
 */
export function checkPasswordStrength(
  password: string,
  userInputs: string[] = [],
): PasswordStrengthResult {
  const result = zxcvbn(password, userInputs);

  return {
    score: result.score,
    isStrong: result.score >= 2, // Require at least "fair" strength
    feedback: {
      warning: result.feedback.warning ?? '',
      suggestions: result.feedback.suggestions,
    },
  };
}

/**
 * Hash a password using Argon2id
 *
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against a hash
 *
 * @param hash - Stored hash
 * @param password - Plain text password to verify
 * @returns true if password matches
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Check if a hash needs to be rehashed
 * (e.g., if Argon2 options have changed)
 *
 * @param hash - Stored hash
 * @returns true if hash should be regenerated
 */
export function needsRehash(hash: string): boolean {
  return argon2.needsRehash(hash, ARGON2_OPTIONS);
}
