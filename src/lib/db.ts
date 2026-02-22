// ============================================================================
// Turso (libSQL) Database Client — Singleton Connection
// ============================================================================

import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;

/**
 * Get or create the Turso database client singleton.
 * Uses environment variables for connection config.
 */
export function getDB(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is not set');
  }

  client = createClient({
    url,
    authToken: authToken || undefined,
  });

  return client;
}
