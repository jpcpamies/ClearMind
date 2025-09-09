import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';

const sqlite = new Database('local.db');
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite);

// Create tables
const tables = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    email_verified INTEGER DEFAULT 0,
    profile_image_url TEXT,
    created_at INTEGER DEFAULT (unixepoch() * 1000),
    updated_at INTEGER DEFAULT (unixepoch() * 1000)
  )`,
  
  `CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    user_id TEXT,
    created_at INTEGER DEFAULT (unixepoch() * 1000),
    updated_at INTEGER DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  
  `CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    completed INTEGER DEFAULT 0,
    canvas_x REAL DEFAULT 0,
    canvas_y REAL DEFAULT 0,
    group_id TEXT,
    user_id TEXT,
    created_at INTEGER DEFAULT (unixepoch() * 1000),
    updated_at INTEGER DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  
  `CREATE TABLE IF NOT EXISTS todo_sections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    group_id TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    user_id TEXT,
    created_at INTEGER DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`
];

try {
  for (const table of tables) {
    db.run(sql.raw(table));
  }
  console.log('Database tables created successfully');
} catch (error) {
  console.error('Error creating tables:', error);
}

sqlite.close();
