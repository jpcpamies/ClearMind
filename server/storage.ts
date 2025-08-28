import {
  ideas,
  groups,
  categories,
  todoSections,
  type Idea,
  type Group,
  type Category,
  type TodoSection,
  type InsertIdea,
  type InsertGroup,
  type InsertCategory,
  type InsertTodoSection,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull } from "drizzle-orm";

export interface IStorage {
  // Ideas operations
  getAllIdeas(userId: string): Promise<Idea[]>;
  getIdea(id: string, userId: string): Promise<Idea | undefined>;
  createIdea(idea: InsertIdea): Promise<Idea>;
  updateIdea(id: string, updates: Partial<InsertIdea>, userId: string): Promise<Idea | null>;
  deleteIdea(id: string, userId: string): Promise<boolean>;

  // Categories operations
  getAllCategories(userId: string): Promise<Category[]>;
  getCategory(id: string, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<InsertCategory>, userId: string): Promise<Category | null>;
  deleteCategory(id: string, userId: string): Promise<boolean>;
  ensureDefaultCategories(userId: string): Promise<Category[]>;

  // Groups operations (legacy - maintain for compatibility)
  getAllGroups(userId: string): Promise<Group[]>;
  getGroup(id: string, userId: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<InsertGroup>, userId: string): Promise<Group | null>;
  deleteGroup(id: string, userId: string): Promise<boolean>;

  // TodoSections operations
  getTodoSectionsByGroup(groupId: string, userId: string): Promise<TodoSection[]>;
  createTodoSection(section: InsertTodoSection): Promise<TodoSection>;
  updateTodoSection(id: string, updates: Partial<InsertTodoSection>): Promise<TodoSection>;
  deleteTodoSection(id: string): Promise<void>;

  // Complex queries
  getIdeasByGroup(groupId: string, userId: string): Promise<Idea[]>;
  getIdeasByCategory(categoryId: string, userId: string): Promise<Idea[]>;
  getUnassignedIdeas(userId: string): Promise<Idea[]>;
  getGroupWithIdeas(groupId: string, userId: string): Promise<(Group & { ideas: Idea[] }) | null>;
  getCategoryWithIdeas(categoryId: string, userId: string): Promise<(Category & { ideas: Idea[] }) | null>;
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

  async createIdea(idea: InsertIdea): Promise<Idea> {
    const [newIdea] = await db
      .insert(ideas)
      .values({ ...idea, updatedAt: new Date() })
      .returning();
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
    return (result.rowCount ?? 0) > 0;
  }

  // Categories operations
  async getAllCategories(userId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId)).orderBy(desc(categories.createdAt));
  }

  async getCategory(id: string, userId: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values({ ...category, updatedAt: new Date() })
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>, userId: string): Promise<Category | null> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return updatedCategory || null;
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    // First verify category belongs to user
    const category = await this.getCategory(id, userId);
    if (!category) return false;
    
    // Find the "General" category to move orphaned ideas
    const generalCategory = await db.select().from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.name, "General")))
      .limit(1);
    
    if (generalCategory.length > 0) {
      // Move all ideas from this category to "General"
      await db.update(ideas)
        .set({ categoryId: generalCategory[0].id })
        .where(and(eq(ideas.categoryId, id), eq(ideas.userId, userId)));
    } else {
      // If no "General" category, just unassign
      await db.update(ideas)
        .set({ categoryId: null })
        .where(and(eq(ideas.categoryId, id), eq(ideas.userId, userId)));
    }
    
    // Delete the category
    const result = await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async ensureDefaultCategories(userId: string): Promise<Category[]> {
    const existingCategories = await this.getAllCategories(userId);
    
    const defaultCategories = [
      { name: "General", color: "#6366f1", userId },
      { name: "Work", color: "#10b981", userId },
      { name: "Personal", color: "#f59e0b", userId },
    ];
    
    const createdCategories: Category[] = [];
    
    for (const defaultCat of defaultCategories) {
      const exists = existingCategories.find(cat => cat.name === defaultCat.name);
      if (!exists) {
        const created = await this.createCategory(defaultCat);
        createdCategories.push(created);
      } else {
        createdCategories.push(exists);
      }
    }
    
    return createdCategories;
  }

  // Groups operations (legacy - maintain for compatibility)
  async getAllGroups(userId: string): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.userId, userId)).orderBy(desc(groups.createdAt));
  }

  async getGroup(id: string, userId: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(and(eq(groups.id, id), eq(groups.userId, userId)));
    return group;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db
      .insert(groups)
      .values({ ...group, updatedAt: new Date() })
      .returning();
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

  async importIdeasFromCategoryToGroup(categoryId: string, groupId: string, userId: string): Promise<void> {
    // Get all ideas from the category
    const categoryIdeas = await this.getIdeasByCategory(categoryId, userId);
    
    // Create new ideas (tasks) in the group based on category ideas
    for (const idea of categoryIdeas) {
      await this.createIdea({
        title: idea.title,
        description: idea.description,
        priority: "medium", // Default priority for imported tasks
        userId: userId,
        groupId: groupId,
        categoryId: null, // Tasks don't belong to categories, only groups
        canvasX: Math.random() * 400, // Random position on canvas
        canvasY: Math.random() * 400,
        completed: false,
      });
    }
  }

  // TodoSections operations
  async getTodoSectionsByGroup(groupId: string, userId: string): Promise<TodoSection[]> {
    return await db
      .select()
      .from(todoSections)
      .where(and(eq(todoSections.groupId, groupId), eq(todoSections.userId, userId)))
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
  async getIdeasByGroup(groupId: string, userId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(and(eq(ideas.groupId, groupId), eq(ideas.userId, userId)));
  }

  async getIdeasByCategory(categoryId: string, userId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(and(eq(ideas.categoryId, categoryId), eq(ideas.userId, userId)));
  }

  async getUnassignedIdeas(userId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(and(isNull(ideas.groupId), isNull(ideas.categoryId), eq(ideas.userId, userId)));
  }

  async getGroupWithIdeas(groupId: string, userId: string): Promise<(Group & { ideas: Idea[] }) | null> {
    const group = await this.getGroup(groupId, userId);
    if (!group) return null;
    const groupIdeas = await this.getIdeasByGroup(groupId, userId);
    return { ...group, ideas: groupIdeas };
  }

  async getCategoryWithIdeas(categoryId: string, userId: string): Promise<(Category & { ideas: Idea[] }) | null> {
    const category = await this.getCategory(categoryId, userId);
    if (!category) return null;
    const categoryIdeas = await this.getIdeasByCategory(categoryId, userId);
    return { ...category, ideas: categoryIdeas };
  }
}

export const storage = new DatabaseStorage();
