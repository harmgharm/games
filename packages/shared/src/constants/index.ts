/**
 * Shared constants across the application
 */

// API
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// Game Types
export const GAME_TYPES = ['trivia', 'word', 'card', 'board'] as const;

// Game Status
export const GAME_STATUSES = [
  'waiting',
  'in_progress',
  'completed',
  'cancelled',
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Timeouts (in milliseconds)
export const WS_HEARTBEAT_INTERVAL = 30000; // 30 seconds
export const WS_RECONNECT_DELAY = 2000; // 2 seconds
export const WS_MAX_RECONNECT_ATTEMPTS = 5;

// Cache TTL (in seconds)
export const CACHE_TTL_SHORT = 60; // 1 minute
export const CACHE_TTL_MEDIUM = 300; // 5 minutes
export const CACHE_TTL_LONG = 3600; // 1 hour
