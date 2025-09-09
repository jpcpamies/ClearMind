import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';

const sqlite = new Database('local.db');
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite);

// First, insert demo user
const insertUser = `
INSERT INTO users (id, email, username, password_hash, display_name, email_verified, created_at, updated_at) VALUES
  ('demo-user', 'demo@clearmind.app', 'demo', 'demo-password-hash', 'Demo User', 1, ${Date.now()}, ${Date.now()})
ON CONFLICT(id) DO NOTHING;
`;

// Insert demo groups
const insertGroups = `
INSERT INTO groups (id, name, color, user_id, created_at, updated_at) VALUES
  ('group-1', 'Work Projects', '#3B82F6', 'demo-user', ${Date.now()}, ${Date.now()}),
  ('group-2', 'Personal Ideas', '#8B5CF6', 'demo-user', ${Date.now()}, ${Date.now()}),
  ('group-3', 'Learning Goals', '#10B981', 'demo-user', ${Date.now()}, ${Date.now()}),
  ('group-4', 'Creative Projects', '#F59E0B', 'demo-user', ${Date.now()}, ${Date.now()})
ON CONFLICT(id) DO NOTHING;
`;

// Insert demo ideas
const insertIdeas = `
INSERT INTO ideas (id, title, description, priority, group_id, canvas_x, canvas_y, user_id, completed, created_at, updated_at) VALUES
  ('idea-1', 'Build a mobile app', 'Create a productivity app for task management', 'high', 'group-1', 100, 100, 'demo-user', 0, ${Date.now()}, ${Date.now()}),
  ('idea-2', 'Learn React Native', 'Study mobile development with React Native', 'medium', 'group-3', 300, 150, 'demo-user', 0, ${Date.now()}, ${Date.now()}),
  ('idea-3', 'Write a blog post', 'Share insights about full-stack development', 'low', 'group-4', 500, 200, 'demo-user', 0, ${Date.now()}, ${Date.now()}),
  ('idea-4', 'Exercise routine', 'Develop a consistent workout schedule', 'high', 'group-2', 200, 300, 'demo-user', 0, ${Date.now()}, ${Date.now()}),
  ('idea-5', 'Read 12 books', 'Set a reading goal for this year', 'medium', 'group-2', 400, 350, 'demo-user', 0, ${Date.now()}, ${Date.now()}),
  ('idea-6', 'Design system update', 'Modernize the component library', 'critical', 'group-1', 250, 450, 'demo-user', 0, ${Date.now()}, ${Date.now()}),
  ('idea-7', 'Learn TypeScript', 'Deep dive into advanced TypeScript features', 'high', 'group-3', 450, 250, 'demo-user', 0, ${Date.now()}, ${Date.now()}),
  ('idea-8', 'Photography project', 'Start a 365-day photo challenge', 'medium', 'group-4', 150, 400, 'demo-user', 0, ${Date.now()}, ${Date.now()})
ON CONFLICT(id) DO NOTHING;
`;

try {
  db.run(sql.raw(insertUser));
  console.log('Demo user created successfully');
  
  db.run(sql.raw(insertGroups));
  console.log('Demo groups created successfully');
  
  db.run(sql.raw(insertIdeas));
  console.log('Demo ideas created successfully');
  
  console.log('Demo data initialized successfully!');
} catch (error) {
  console.error('Error creating demo data:', error);
}

sqlite.close();