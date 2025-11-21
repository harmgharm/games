/**
 * Database Module
 *
 * Public exports for database access.
 */

// Client
export { checkDatabaseConnection, closeDatabase, db } from './client.js';

// Transactions
export type { DatabaseTransaction } from './transaction.js';
export { withTransaction } from './transaction.js';

// Queries
export * from './queries/index.js';
