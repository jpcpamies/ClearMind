import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Ideas table
export const ideas = pgTable("ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  name: text("name").notNull(),
  color: varchar("color").notNull(), // purple, blue, green, orange
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TodoList sections table
export const todoSections = pgTable("todo_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  createdAt: true,
  updatedAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTodoSectionSchema = createInsertSchema(todoSections).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertTodoSection = z.infer<typeof insertTodoSectionSchema>;
export type Idea = typeof ideas.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type TodoSection = typeof todoSections.$inferSelect;
