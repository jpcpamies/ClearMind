import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Use SQLite for local development if DATABASE_URL is not set
const isDevelopment = process.env.NODE_ENV === 'development';
const hasDatabaseUrl = !!process.env.DATABASE_URL;

let db: any;

if (isDevelopment && !hasDatabaseUrl) {
  // Use local SQLite database for development
  const sqlite = new Database('local.db');
  sqlite.pragma('journal_mode = WAL');
  db = drizzle(sqlite, { schema });
  console.log('Using local SQLite database for development');
} else {
  // Use Neon PostgreSQL for production
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set for production. Did you forget to provision a database?",
    );
  }
  
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const ws = await import('ws');
  neonConfig.webSocketConstructor = ws.default;
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { drizzle: drizzleNeon } = await import('drizzle-orm/neon-serverless');
  db = drizzleNeon({ client: pool, schema });
}

export { db };
export const pool = null; // Not used with SQLite