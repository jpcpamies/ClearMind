import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Ideas table
export const ideas = pgTable("ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: varchar("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  groupId: varchar("group_id"), // Reference to groups table (idea containers)
  canvasX: real("canvas_x").default(0),
  canvasY: real("canvas_y").default(0),
  completed: boolean("completed").default(false),
  sectionId: varchar("section_id"), // Reference to todo_sections table for task organization
  taskOrder: integer("task_order"), // Order within a todo section
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Groups table (idea containers as per PRD)
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  color: varchar("color").notNull(), // hex color format #RRGGBB
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TodoList sections table
export const todoSections = pgTable("todo_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  groupId: varchar("group_id").notNull(),
  name: text("name").notNull(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const groupsRelations = relations(groups, ({ many }) => ({
  ideas: many(ideas),
  todoSections: many(todoSections),
}));

export const ideasRelations = relations(ideas, ({ one }) => ({
  group: one(groups, {
    fields: [ideas.groupId],
    references: [groups.id],
  }),
  section: one(todoSections, {
    fields: [ideas.sectionId],
    references: [todoSections.id],
  }),
}));

export const todoSectionsRelations = relations(todoSections, ({ one, many }) => ({
  group: one(groups, {
    fields: [todoSections.groupId],
    references: [groups.id],
  }),
  ideas: many(ideas),
}));

// Insert schemas
export const insertIdeaSchema = createInsertSchema(ideas).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  canvasX: z.number().optional(),
  canvasY: z.number().optional(),
  completed: z.boolean().optional(),
  groupId: z.string().optional(),
  sectionId: z.string().optional(),
  taskOrder: z.number().optional(),
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
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

// User storage table for email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  username: varchar("username").unique().notNull(),
  displayName: varchar("display_name").notNull(),
  emailVerified: boolean("email_verified").default(false),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertTodoSection = z.infer<typeof insertTodoSectionSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Idea = typeof ideas.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type TodoSection = typeof todoSections.$inferSelect;
export type User = typeof users.$inferSelect;

// Predefined color palette for groups/containers
export const GROUP_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
] as const;
