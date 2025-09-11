import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

// Create an in-memory SQLite database for testing
const sqlite = new Database(':memory:');
export const db = drizzle(sqlite);

// Create tables
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email_verified INTEGER DEFAULT 0,
    profile_image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

const createGroupsTable = `
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

const createIdeasTable = `
  CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    group_id TEXT,
    canvas_x REAL DEFAULT 0,
    canvas_y REAL DEFAULT 0,
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

const createTodoSectionsTable = `
  CREATE TABLE IF NOT EXISTS todo_sections (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// Execute table creation
sqlite.exec(createUsersTable);
sqlite.exec(createGroupsTable);
sqlite.exec(createIdeasTable);
sqlite.exec(createTodoSectionsTable);

// Insert a demo user
const insertDemoUser = sqlite.prepare(`
  INSERT INTO users (id, email, password_hash, username, display_name, email_verified)
  VALUES ('demo-user-id', 'demo@example.com', 'demo-hash', 'demo', 'Demo User', 1)
`);

try {
  insertDemoUser.run();
} catch (e) {
  // User might already exist, ignore
}

// Insert some demo groups
const insertDemoGroups = sqlite.prepare(`
  INSERT OR IGNORE INTO groups (id, user_id, name, color)
  VALUES (?, 'demo-user-id', ?, ?)
`);

const demoGroups = [
  ['group-1', 'Work Projects', 'blue'],
  ['group-2', 'Personal Ideas', 'purple'],
  ['group-3', 'Learning Goals', 'green'],
  ['group-4', 'Creative Projects', 'orange']
];

demoGroups.forEach(([id, name, color]) => {
  try {
    insertDemoGroups.run(id, name, color);
  } catch (e) {
    // Group might already exist, ignore
  }
});

// Insert some demo ideas
const insertDemoIdeas = sqlite.prepare(`
  INSERT OR IGNORE INTO ideas (id, user_id, title, description, priority, group_id, canvas_x, canvas_y)
  VALUES (?, 'demo-user-id', ?, ?, ?, ?, ?, ?)
`);

const demoIdeas = [
  ['idea-1', 'Build a mobile app', 'Create a productivity app for task management', 'high', 'group-1', 100, 100],
  ['idea-2', 'Learn React Native', 'Study mobile development with React Native', 'medium', 'group-3', 300, 150],
  ['idea-3', 'Write a blog post', 'Share insights about full-stack development', 'low', 'group-4', 500, 200],
  ['idea-4', 'Exercise routine', 'Develop a consistent workout schedule', 'high', 'group-2', 200, 300],
  ['idea-5', 'Read 12 books', 'Set a reading goal for this year', 'medium', 'group-2', 400, 350],
];

demoIdeas.forEach(([id, title, description, priority, groupId, x, y]) => {
  try {
    insertDemoIdeas.run(id, title, description, priority, groupId, x, y);
  } catch (e) {
    // Idea might already exist, ignore
  }
});

console.log('SQLite demo database initialized with sample data');