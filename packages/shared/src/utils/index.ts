/**
 * Shared utility functions
 */

/**
 * Type-safe object keys helper
 */
export function keys<T extends object>(object: T): (keyof T)[] {
  return Object.keys(object) as (keyof T)[];
}

/**
 * Type-safe object entries helper
 */
export function entries<T extends object>(object: T): [keyof T, T[keyof T]][] {
  return Object.entries(object) as [keyof T, T[keyof T]][];
}

/**
 * Sleep utility for async/await
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamps a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
