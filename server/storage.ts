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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull } from "drizzle-orm";

export interface IStorage {
  // Ideas operations
  getAllIdeas(userId: string): Promise<Idea[]>;
  getIdea(id: string, userId: string): Promise<Idea | undefined>;
  createIdea(ideaData: InsertIdea & { userId: string }): Promise<Idea>;
  updateIdea(id: string, updates: Partial<InsertIdea>, userId: string): Promise<Idea | null>;
  deleteIdea(id: string, userId: string): Promise<boolean>;

  // Groups operations
  getAllGroups(userId: string): Promise<Group[]>;
  getGroup(id: string, userId: string): Promise<Group | undefined>;
  createGroup(groupData: InsertGroup & { userId: string }): Promise<Group>;
  updateGroup(id: string, updates: Partial<InsertGroup>, userId: string): Promise<Group | null>;
  deleteGroup(id: string, userId: string): Promise<boolean>;

  // TodoSections operations
  getTodoSectionsByGroup(groupId: string, userId: string): Promise<TodoSection[]>;
  createTodoSection(section: InsertTodoSection & { userId: string }): Promise<TodoSection>;
  updateTodoSection(id: string, updates: Partial<InsertTodoSection>): Promise<TodoSection>;
  deleteTodoSection(id: string): Promise<void>;

  // Complex queries
  getIdeasByGroup(groupId: string, userId: string): Promise<Idea[]>;
  getUnassignedIdeas(userId: string): Promise<Idea[]>;
  getGroupWithIdeas(groupId: string, userId: string): Promise<(Group & { ideas: Idea[] }) | null>;
}

export class DatabaseStorage implements IStorage {
  // Ideas operations
  async getAllIdeas(userId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(eq(ideas.userId, userId)).orderBy(desc(ideas.createdAt));
  }

  async getIdea(id: string, userId: string): Promise<Idea | undefined> {
    const [idea] = await db.select().from(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, userId)));
    return idea;
  }

  async createIdea(ideaData: InsertIdea & { userId: string }): Promise<Idea> {
    const [newIdea] = await db
      .insert(ideas)
      .values(ideaData)
      .returning();
    return newIdea;
  }

  async updateIdea(id: string, updates: Partial<InsertIdea>, userId: string): Promise<Idea | null> {
    const [updatedIdea] = await db
      .update(ideas)
      .set(updates)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .returning();
    return updatedIdea || null;
  }

  async deleteIdea(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Groups operations
  async getAllGroups(userId: string): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.userId, userId)).orderBy(desc(groups.createdAt));
  }

  async getGroup(id: string, userId: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(and(eq(groups.id, id), eq(groups.userId, userId)));
    return group;
  }

  async createGroup(groupData: InsertGroup & { userId: string }): Promise<Group> {
    const [newGroup] = await db
      .insert(groups)
      .values(groupData)
      .returning();
    return newGroup;
  }

  async updateGroup(id: string, updates: Partial<InsertGroup>, userId: string): Promise<Group | null> {
    const [updatedGroup] = await db
      .update(groups)
      .set(updates)
      .where(and(eq(groups.id, id), eq(groups.userId, userId)))
      .returning();
    return updatedGroup || null;
  }

  async deleteGroup(id: string, userId: string): Promise<boolean> {
    // First verify group belongs to user
    const group = await this.getGroup(id, userId);
    if (!group) return false;
    
    // First, unassign all ideas from this group (only user's ideas)
    await db.update(ideas).set({ groupId: null }).where(and(eq(ideas.groupId, id), eq(ideas.userId, userId)));
    // Delete todo sections (only user's sections)
    await db.delete(todoSections).where(and(eq(todoSections.groupId, id), eq(todoSections.userId, userId)));
    // Delete the group
    const result = await db.delete(groups).where(and(eq(groups.id, id), eq(groups.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }


  // TodoSections operations
  async getTodoSectionsByGroup(groupId: string, userId: string): Promise<TodoSection[]> {
    return await db
      .select()
      .from(todoSections)
      .where(and(eq(todoSections.groupId, groupId), eq(todoSections.userId, userId)))
      .orderBy(todoSections.order);
  }

  async createTodoSection(section: InsertTodoSection & { userId: string }): Promise<TodoSection> {
    const [newSection] = await db
      .insert(todoSections)
      .values(section)
      .returning();
    return newSection;
  }

  async updateTodoSection(id: string, updates: Partial<InsertTodoSection>): Promise<TodoSection> {
    const [updatedSection] = await db
      .update(todoSections)
      .set(updates)
      .where(eq(todoSections.id, id))
      .returning();
    return updatedSection;
  }

  async deleteTodoSection(id: string): Promise<void> {
    await db.delete(todoSections).where(eq(todoSections.id, id));
  }

  // Complex queries
  async getIdeasByGroup(groupId: string, userId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(and(eq(ideas.groupId, groupId), eq(ideas.userId, userId)));
  }

  async getUnassignedIdeas(userId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(and(isNull(ideas.groupId), eq(ideas.userId, userId)));
  }

  async getGroupWithIdeas(groupId: string, userId: string): Promise<(Group & { ideas: Idea[] }) | null> {
    const group = await this.getGroup(groupId, userId);
    if (!group) return null;
    const groupIdeas = await this.getIdeasByGroup(groupId, userId);
    return { ...group, ideas: groupIdeas };
  }

}

export const storage = new DatabaseStorage();
