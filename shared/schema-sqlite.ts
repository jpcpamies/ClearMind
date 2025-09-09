import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table for email/password authentication
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  username: text("username").unique().notNull(),
  displayName: text("display_name"),
  emailVerified: integer("email_verified", { mode: 'boolean' }).default(false),
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(unixepoch() * 1000)`),
});

// Groups table (idea containers as per PRD)
export const groups = sqliteTable("groups", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(unixepoch() * 1000)`),
});

// Ideas table
export const ideas = sqliteTable("ideas", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  groupId: text("group_id"),
  canvasX: real("canvas_x").default(0),
  canvasY: real("canvas_y").default(0),
  completed: integer("completed", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(unixepoch() * 1000)`),
});

// TodoList sections table
export const todoSections = sqliteTable("todo_sections", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  groupId: text("group_id").notNull(),
  title: text("title").notNull(),
  position: integer("position").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch() * 1000)`),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type TodoSection = typeof todoSections.$inferSelect;
export type NewTodoSection = typeof todoSections.$inferInsert;

// Insert schemas
export const insertIdeaSchema = createInsertSchema(ideas).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  canvasX: z.number().optional(),
  canvasY: z.number().optional(),
  completed: z.boolean().optional(),
  groupId: z.string().optional(),
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  color: z.string().min(1, "Color is required").refine((color) => {
    // Check for hex colors
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return true;
    // Check for hex colors with 3 digits
    if (/^#[0-9A-Fa-f]{3}$/.test(color)) return true;
    // Check for RGB
    if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color)) return true;
    // Check for RGBA
    if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color)) return true;
    // Check for HSL
    if (/^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/.test(color)) return true;
    // Check for HSLA
    if (/^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/.test(color)) return true;
    // Check for named colors (basic set)
    const namedColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'cyan', 'magenta', 'lime', 'indigo', 'violet', 'brown', 'black', 'white', 'gray', 'grey', 'maroon', 'navy', 'olive', 'teal', 'silver', 'aqua', 'fuchsia', 'emerald'];
    if (namedColors.includes(color.toLowerCase())) return true;
    return false;
  }, "Color must be a valid CSS color (hex, rgb, hsl, or named color)"),
});

export const insertTodoSectionSchema = createInsertSchema(todoSections).omit({
  id: true,
  userId: true,
  createdAt: true,
});