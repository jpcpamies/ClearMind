import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let db: any;
let pool: any;

// Use SQLite for development if no DATABASE_URL is set or if it's set to sqlite
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('sqlite:')) {
  console.log('Using SQLite database for development...');
  
  const sqlite = new Database(':memory:');
  
  // Create a custom randomId function
  function randomId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  // Create tables for SQLite without PostgreSQL functions
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      email_verified INTEGER DEFAULT 0,
      profile_image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      group_id TEXT,
      canvas_x REAL DEFAULT 0,
      canvas_y REAL DEFAULT 0,
      completed INTEGER DEFAULT 0,
      section_id TEXT,
      task_order INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS todo_sections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      "order" INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Override the schema to use custom ID generation for SQLite
  const originalSchema = { ...schema };
  
  // Create a custom insert function that adds IDs
  const originalInsert = sqlite.prepare.bind(sqlite);
  
  db = drizzleSqlite(sqlite, { schema: originalSchema });
  
  console.log('SQLite database initialized');
} else {
  console.log('Using Neon database...');
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db, pool };