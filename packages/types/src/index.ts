/**
 * Shared TypeScript types and interfaces
 */

// Error types
export * from './errors';

// Database types
export * from './db/index';

// API Response types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
    timestamp: string;
  };
}
