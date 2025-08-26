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
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Ideas operations
  getAllIdeas(): Promise<Idea[]>;
  getIdea(id: string): Promise<Idea | undefined>;
  createIdea(idea: InsertIdea): Promise<Idea>;
  updateIdea(id: string, updates: Partial<InsertIdea>): Promise<Idea>;
  deleteIdea(id: string): Promise<void>;

  // Groups operations
  getAllGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group>;
  deleteGroup(id: string): Promise<void>;

  // TodoSections operations
  getTodoSectionsByGroup(groupId: string): Promise<TodoSection[]>;
  createTodoSection(section: InsertTodoSection): Promise<TodoSection>;
  updateTodoSection(id: string, updates: Partial<InsertTodoSection>): Promise<TodoSection>;
  deleteTodoSection(id: string): Promise<void>;

  // Complex queries
  getIdeasByGroup(groupId: string): Promise<Idea[]>;
  getUnassignedIdeas(): Promise<Idea[]>;
  getGroupWithIdeas(groupId: string): Promise<Group & { ideas: Idea[] }>;
}

export class DatabaseStorage implements IStorage {
  // Ideas operations
  async getAllIdeas(): Promise<Idea[]> {
    return await db.select().from(ideas).orderBy(desc(ideas.createdAt));
  }

  async getIdea(id: string): Promise<Idea | undefined> {
    const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
    return idea;
  }

  async createIdea(idea: InsertIdea): Promise<Idea> {
    const [newIdea] = await db
      .insert(ideas)
      .values({ ...idea, updatedAt: new Date() })
      .returning();
    return newIdea;
  }

  async updateIdea(id: string, updates: Partial<InsertIdea>): Promise<Idea> {
    const [updatedIdea] = await db
      .update(ideas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ideas.id, id))
      .returning();
    return updatedIdea;
  }

  async deleteIdea(id: string): Promise<void> {
    await db.delete(ideas).where(eq(ideas.id, id));
  }

  // Groups operations
  async getAllGroups(): Promise<Group[]> {
    return await db.select().from(groups).orderBy(desc(groups.createdAt));
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db
      .insert(groups)
      .values({ ...group, updatedAt: new Date() })
      .returning();
    return newGroup;
  }

  async updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group> {
    const [updatedGroup] = await db
      .update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteGroup(id: string): Promise<void> {
    // First, unassign all ideas from this group
    await db.update(ideas).set({ groupId: null }).where(eq(ideas.groupId, id));
    // Delete todo sections
    await db.delete(todoSections).where(eq(todoSections.groupId, id));
    // Delete the group
    await db.delete(groups).where(eq(groups.id, id));
  }

  // TodoSections operations
  async getTodoSectionsByGroup(groupId: string): Promise<TodoSection[]> {
    return await db
      .select()
      .from(todoSections)
      .where(eq(todoSections.groupId, groupId))
      .orderBy(todoSections.order);
  }

  async createTodoSection(section: InsertTodoSection): Promise<TodoSection> {
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
  async getIdeasByGroup(groupId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(eq(ideas.groupId, groupId));
  }

  async getUnassignedIdeas(): Promise<Idea[]> {
    return await db.select().from(ideas).where(eq(ideas.groupId, null));
  }

  async getGroupWithIdeas(groupId: string): Promise<Group & { ideas: Idea[] }> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error("Group not found");
    const groupIdeas = await this.getIdeasByGroup(groupId);
    return { ...group, ideas: groupIdeas };
  }
}

export const storage = new DatabaseStorage();
