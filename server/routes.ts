import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIdeaSchema, insertGroupSchema, insertCategorySchema, insertTodoSectionSchema } from "@shared/schema";
import { auth } from "./middleware/auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  const authRoutes = await import('./routes/auth');
  app.use('/api/auth', authRoutes.default);
  // Ideas routes
  app.get("/api/ideas", auth, async (req: any, res) => {
    try {
      const ideas = await storage.getAllIdeas(req.user.id);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });

  app.get("/api/ideas/:id", auth, async (req: any, res) => {
    try {
      const idea = await storage.getIdea(req.params.id, req.user.id);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      res.json(idea);
    } catch (error) {
      console.error("Error fetching idea:", error);
      res.status(500).json({ message: "Failed to fetch idea" });
    }
  });

  app.post("/api/ideas", auth, async (req: any, res) => {
    try {
      const validatedData = insertIdeaSchema.parse(req.body);
      const ideaData = {
        ...validatedData,
        userId: req.user.id,
        canvasX: validatedData.canvasX ?? 0,
        canvasY: validatedData.canvasY ?? 0,
        completed: validatedData.completed ?? false,
      };
      const idea = await storage.createIdea(ideaData);
      res.status(201).json(idea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating idea:", error);
      res.status(500).json({ message: "Failed to create idea" });
    }
  });

  app.put("/api/ideas/:id", auth, async (req: any, res) => {
    try {
      const validatedData = insertIdeaSchema.partial().parse(req.body);
      const idea = await storage.updateIdea(req.params.id, validatedData, req.user.id);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      res.json(idea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating idea:", error);
      res.status(500).json({ message: "Failed to update idea" });
    }
  });

  app.delete("/api/ideas/:id", auth, async (req: any, res) => {
    try {
      const deleted = await storage.deleteIdea(req.params.id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Idea not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting idea:", error);
      res.status(500).json({ message: "Failed to delete idea" });
    }
  });

  // Categories routes  
  app.get("/api/categories", auth, async (req: any, res) => {
    try {
      // Ensure default categories exist
      await storage.ensureDefaultCategories(req.user.id);
      const categories = await storage.getAllCategories(req.user.id);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", auth, async (req: any, res) => {
    try {
      const category = await storage.getCategory(req.params.id, req.user.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.get("/api/categories/:id/with-ideas", auth, async (req: any, res) => {
    try {
      const categoryWithIdeas = await storage.getCategoryWithIdeas(req.params.id, req.user.id);
      if (!categoryWithIdeas) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(categoryWithIdeas);
    } catch (error) {
      console.error("Error fetching category with ideas:", error);
      res.status(500).json({ message: "Failed to fetch category with ideas" });
    }
  });

  app.post("/api/categories", auth, async (req: any, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const categoryData = {
        ...validatedData,
        userId: req.user.id,
      };
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", auth, async (req: any, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData, req.user.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", auth, async (req: any, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Groups routes (legacy - maintained for compatibility)
  app.get("/api/groups", auth, async (req: any, res) => {
    try {
      const groups = await storage.getAllGroups(req.user.id);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/:id", auth, async (req: any, res) => {
    try {
      const group = await storage.getGroup(req.params.id, req.user.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  app.get("/api/groups/:id/with-ideas", auth, async (req: any, res) => {
    try {
      const groupWithIdeas = await storage.getGroupWithIdeas(req.params.id, req.user.id);
      if (!groupWithIdeas) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(groupWithIdeas);
    } catch (error) {
      console.error("Error fetching group with ideas:", error);
      res.status(500).json({ message: "Failed to fetch group with ideas" });
    }
  });

  app.post("/api/groups", auth, async (req: any, res) => {
    try {
      const { categoryId, importIdeas, ...groupData } = req.body;
      const validatedData = insertGroupSchema.parse(groupData);
      const finalGroupData = {
        ...validatedData,
        userId: req.user.id,
      };
      
      const group = await storage.createGroup(finalGroupData);
      
      // If importing ideas from category, convert them to tasks
      if (importIdeas && categoryId) {
        await storage.importIdeasFromCategoryToGroup(categoryId, group.id, req.user.id);
      }
      
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.put("/api/groups/:id", auth, async (req: any, res) => {
    try {
      const validatedData = insertGroupSchema.partial().parse(req.body);
      const group = await storage.updateGroup(req.params.id, validatedData, req.user.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  app.delete("/api/groups/:id", auth, async (req: any, res) => {
    try {
      console.log(`DELETE /api/groups/${req.params.id} called by user ${req.user.id}`);
      const deleted = await storage.deleteGroup(req.params.id, req.user.id);
      console.log("Delete operation result:", deleted);
      if (!deleted) {
        console.log("Group not found or not belonging to user");
        return res.status(404).json({ message: "Group not found" });
      }
      console.log("Group deleted successfully");
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // TodoSections routes
  app.get("/api/groups/:groupId/todo-sections", auth, async (req: any, res) => {
    try {
      const sections = await storage.getTodoSectionsByGroup(req.params.groupId, req.user.id);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching todo sections:", error);
      res.status(500).json({ message: "Failed to fetch todo sections" });
    }
  });

  app.post("/api/todo-sections", auth, async (req: any, res) => {
    try {
      const validatedData = insertTodoSectionSchema.parse(req.body);
      const section = await storage.createTodoSection({...validatedData, userId: req.user.id});
      res.status(201).json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating todo section:", error);
      res.status(500).json({ message: "Failed to create todo section" });
    }
  });

  // Utility routes
  app.get("/api/ideas/unassigned", auth, async (req: any, res) => {
    try {
      const ideas = await storage.getUnassignedIdeas(req.user.id);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching unassigned ideas:", error);
      res.status(500).json({ message: "Failed to fetch unassigned ideas" });
    }
  });

  app.get("/api/groups/:groupId/ideas", auth, async (req: any, res) => {
    try {
      const ideas = await storage.getIdeasByGroup(req.params.groupId, req.user.id);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching ideas by group:", error);
      res.status(500).json({ message: "Failed to fetch ideas by group" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
