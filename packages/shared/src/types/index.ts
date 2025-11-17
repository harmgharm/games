/**
 * Shared TypeScript types and interfaces
 */

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Game types
export type GameType = 'trivia' | 'word' | 'card' | 'board';

export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled';

export interface Game {
  id: string;
  type: GameType;
  status: GameStatus;
  createdAt: Date;
  updatedAt: Date;
  finishedAt?: Date;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
    timestamp: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
