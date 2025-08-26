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
  groupId: varchar("group_id"),
  canvasX: real("canvas_x").default(0),
  canvasY: real("canvas_y").default(0),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Groups table
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  color: varchar("color").notNull(), // purple, blue, green, orange
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
}));

export const todoSectionsRelations = relations(todoSections, ({ one }) => ({
  group: one(groups, {
    fields: [todoSections.groupId],
    references: [groups.id],
  }),
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
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTodoSectionSchema = createInsertSchema(todoSections).omit({
  id: true,
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
