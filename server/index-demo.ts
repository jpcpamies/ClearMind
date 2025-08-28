import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic } from "./vite.js";
import { storage } from "./storage-sqlite.js";
import { insertIdeaSchema, insertGroupSchema, insertTodoSectionSchema } from "../shared/schema.js";
import { z } from "zod";
import { createServer } from "http";

// Initialize SQLite database
import "./db-sqlite.js";

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple demo authentication middleware - always authenticate as demo user
app.use((req: any, res, next) => {
  req.user = { id: 'demo-user-id' };
  next();
});

const log = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [express] ${message}`);
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Simple auth middleware for demo
const auth = (req: any, res: any, next: any) => {
  req.user = { id: 'demo-user-id' };
  next();
};

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

// Groups routes
app.get("/api/groups", auth, async (req: any, res) => {
  try {
    const groups = await storage.getAllGroups(req.user.id);
    res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
});

app.post("/api/groups", auth, async (req: any, res) => {
  try {
    const validatedData = insertGroupSchema.parse(req.body);
    const groupData = {
      ...validatedData,
      userId: req.user.id,
    };
    const group = await storage.createGroup(groupData);
    res.status(201).json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Failed to create group" });
  }
});

(async () => {
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup vite in development
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();