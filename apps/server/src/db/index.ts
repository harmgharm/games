/**
 * Database Module
 *
 * Public exports for database access.
 */

// Client
export { checkDatabaseConnection, closeDatabase, db } from './client';

// Transactions
export type { DatabaseTransaction } from './transaction';
export { withTransaction } from './transaction';

// Queries
export * from './queries';
