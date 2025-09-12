import {
  ideas,
  groups,
  todoSections,
  type Idea,
  type Group,
  type TodoSection,
  type InsertIdea,
  type InsertGroup,
  type InsertTodoSection,
} from "../shared/schema.js";
import { db } from "./db-sqlite.js";
import { eq, desc, and, isNull } from "drizzle-orm";

export interface IStorage {
  getAllIdeas(userId: string): Promise<Idea[]>;
  getIdea(id: string, userId: string): Promise<Idea | undefined>;
  createIdea(idea: InsertIdea): Promise<Idea>;
  updateIdea(id: string, updates: Partial<InsertIdea>, userId: string): Promise<Idea | null>;
  deleteIdea(id: string, userId: string): Promise<boolean>;
  getAllGroups(userId: string): Promise<Group[]>;
  getGroup(id: string, userId: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<InsertGroup>, userId: string): Promise<Group | null>;
  deleteGroup(id: string, userId: string): Promise<boolean>;
  getTodoSectionsByGroup(groupId: string, userId: string): Promise<TodoSection[]>;
  createTodoSection(section: InsertTodoSection): Promise<TodoSection>;
  updateTodoSection(id: string, updates: Partial<InsertTodoSection>): Promise<TodoSection>;
  deleteTodoSection(id: string): Promise<void>;
  getIdeasByGroup(groupId: string, userId: string): Promise<Idea[]>;
  getUnassignedIdeas(userId: string): Promise<Idea[]>;
  getGroupWithIdeas(groupId: string, userId: string): Promise<(Group & { ideas: Idea[] }) | null>;
}

export class DatabaseStorage implements IStorage {
  async getAllIdeas(userId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(eq(ideas.userId, userId)).orderBy(desc(ideas.createdAt));
  }

  async getIdea(id: string, userId: string): Promise<Idea | undefined> {
    const [idea] = await db.select().from(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, userId)));
    return idea;
  }

  async createIdea(idea: InsertIdea): Promise<Idea> {
    const [newIdea] = await db.insert(ideas).values(idea).returning();
    return newIdea;
  }

  async updateIdea(id: string, updates: Partial<InsertIdea>, userId: string): Promise<Idea | null> {
    const [updatedIdea] = await db
      .update(ideas)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .returning();
    return updatedIdea || null;
  }

  async deleteIdea(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, userId)));
    return result.changes > 0;
  }

  async getAllGroups(userId: string): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.userId, userId)).orderBy(desc(groups.createdAt));
  }

  async getGroup(id: string, userId: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(and(eq(groups.id, id), eq(groups.userId, userId)));
    return group;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async updateGroup(id: string, updates: Partial<InsertGroup>, userId: string): Promise<Group | null> {
    const [updatedGroup] = await db
      .update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(groups.id, id), eq(groups.userId, userId)))
      .returning();
    return updatedGroup || null;
  }

  async deleteGroup(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(groups).where(and(eq(groups.id, id), eq(groups.userId, userId)));
    return result.changes > 0;
  }

  async getTodoSectionsByGroup(groupId: string, userId: string): Promise<TodoSection[]> {
    return await db.select().from(todoSections).where(and(eq(todoSections.groupId, groupId), eq(todoSections.userId, userId)));
  }

  async createTodoSection(section: InsertTodoSection): Promise<TodoSection> {
    const [newSection] = await db.insert(todoSections).values(section).returning();
    return newSection;
  }

  async updateTodoSection(id: string, updates: Partial<InsertTodoSection>): Promise<TodoSection> {
    const [updatedSection] = await db.update(todoSections).set(updates).where(eq(todoSections.id, id)).returning();
    return updatedSection;
  }

  async deleteTodoSection(id: string): Promise<void> {
    await db.delete(todoSections).where(eq(todoSections.id, id));
  }

  async getIdeasByGroup(groupId: string, userId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(and(eq(ideas.groupId, groupId), eq(ideas.userId, userId)));
  }

  async getUnassignedIdeas(userId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(and(eq(ideas.userId, userId), isNull(ideas.groupId)));
  }

  async getGroupWithIdeas(groupId: string, userId: string): Promise<(Group & { ideas: Idea[] }) | null> {
    const group = await this.getGroup(groupId, userId);
    if (!group) return null;
    
    const groupIdeas = await this.getIdeasByGroup(groupId, userId);
    return { ...group, ideas: groupIdeas };
  }
}

export const storage = new DatabaseStorage();