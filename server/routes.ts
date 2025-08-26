import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIdeaSchema, insertGroupSchema, insertTodoSectionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ideas routes
  app.get("/api/ideas", async (req, res) => {
    try {
      const ideas = await storage.getAllIdeas();
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });

  app.get("/api/ideas/:id", async (req, res) => {
    try {
      const idea = await storage.getIdea(req.params.id);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      res.json(idea);
    } catch (error) {
      console.error("Error fetching idea:", error);
      res.status(500).json({ message: "Failed to fetch idea" });
    }
  });

  app.post("/api/ideas", async (req, res) => {
    try {
      const validatedData = insertIdeaSchema.parse(req.body);
      const idea = await storage.createIdea(validatedData);
      res.status(201).json(idea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating idea:", error);
      res.status(500).json({ message: "Failed to create idea" });
    }
  });

  app.put("/api/ideas/:id", async (req, res) => {
    try {
      const validatedData = insertIdeaSchema.partial().parse(req.body);
      const idea = await storage.updateIdea(req.params.id, validatedData);
      res.json(idea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating idea:", error);
      res.status(500).json({ message: "Failed to update idea" });
    }
  });

  app.delete("/api/ideas/:id", async (req, res) => {
    try {
      await storage.deleteIdea(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting idea:", error);
      res.status(500).json({ message: "Failed to delete idea" });
    }
  });

  // Groups routes
  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  app.get("/api/groups/:id/with-ideas", async (req, res) => {
    try {
      const groupWithIdeas = await storage.getGroupWithIdeas(req.params.id);
      res.json(groupWithIdeas);
    } catch (error) {
      console.error("Error fetching group with ideas:", error);
      res.status(500).json({ message: "Failed to fetch group with ideas" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const validatedData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.put("/api/groups/:id", async (req, res) => {
    try {
      const validatedData = insertGroupSchema.partial().parse(req.body);
      const group = await storage.updateGroup(req.params.id, validatedData);
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      await storage.deleteGroup(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // TodoSections routes
  app.get("/api/groups/:groupId/todo-sections", async (req, res) => {
    try {
      const sections = await storage.getTodoSectionsByGroup(req.params.groupId);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching todo sections:", error);
      res.status(500).json({ message: "Failed to fetch todo sections" });
    }
  });

  app.post("/api/todo-sections", async (req, res) => {
    try {
      const validatedData = insertTodoSectionSchema.parse(req.body);
      const section = await storage.createTodoSection(validatedData);
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
  app.get("/api/ideas/unassigned", async (req, res) => {
    try {
      const ideas = await storage.getUnassignedIdeas();
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching unassigned ideas:", error);
      res.status(500).json({ message: "Failed to fetch unassigned ideas" });
    }
  });

  app.get("/api/groups/:groupId/ideas", async (req, res) => {
    try {
      const ideas = await storage.getIdeasByGroup(req.params.groupId);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching ideas by group:", error);
      res.status(500).json({ message: "Failed to fetch ideas by group" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
