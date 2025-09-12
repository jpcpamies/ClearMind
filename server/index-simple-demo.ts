import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic } from "./vite.js";

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const log = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [express] ${message}`);
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Mock data for demo
const demoGroups = [
  { id: 'group-1', userId: 'demo-user-id', name: 'Work Projects', color: 'blue', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'group-2', userId: 'demo-user-id', name: 'Personal Ideas', color: 'purple', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'group-3', userId: 'demo-user-id', name: 'Learning Goals', color: 'green', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'group-4', userId: 'demo-user-id', name: 'Creative Projects', color: 'orange', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

let demoIdeas = [
  { id: 'idea-1', userId: 'demo-user-id', title: 'Build a mobile app', description: 'Create a productivity app for task management', priority: 'high', groupId: 'group-1', canvasX: 100, canvasY: 100, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'idea-2', userId: 'demo-user-id', title: 'Learn React Native', description: 'Study mobile development with React Native', priority: 'medium', groupId: 'group-3', canvasX: 300, canvasY: 150, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'idea-3', userId: 'demo-user-id', title: 'Write a blog post', description: 'Share insights about full-stack development', priority: 'low', groupId: 'group-4', canvasX: 500, canvasY: 200, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'idea-4', userId: 'demo-user-id', title: 'Exercise routine', description: 'Develop a consistent workout schedule', priority: 'high', groupId: 'group-2', canvasX: 200, canvasY: 300, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'idea-5', userId: 'demo-user-id', title: 'Read 12 books', description: 'Set a reading goal for this year', priority: 'medium', groupId: 'group-2', canvasX: 400, canvasY: 350, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

// Simple demo auth middleware
const auth = (req: any, res: any, next: any) => {
  req.user = { id: 'demo-user-id' };
  next();
};

// Ideas routes
app.get("/api/ideas", auth, async (req: any, res) => {
  try {
    res.json(demoIdeas);
  } catch (error) {
    console.error("Error fetching ideas:", error);
    res.status(500).json({ message: "Failed to fetch ideas" });
  }
});

app.post("/api/ideas", auth, async (req: any, res) => {
  try {
    const newIdea = {
      id: `idea-${Date.now()}`,
      userId: req.user.id,
      title: req.body.title || 'New Idea',
      description: req.body.description || '',
      priority: req.body.priority || 'medium',
      groupId: req.body.groupId || null,
      canvasX: req.body.canvasX || 0,
      canvasY: req.body.canvasY || 0,
      completed: req.body.completed || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    demoIdeas.push(newIdea);
    res.status(201).json(newIdea);
  } catch (error) {
    console.error("Error creating idea:", error);
    res.status(500).json({ message: "Failed to create idea" });
  }
});

app.put("/api/ideas/:id", auth, async (req: any, res) => {
  try {
    const ideaIndex = demoIdeas.findIndex(idea => idea.id === req.params.id);
    if (ideaIndex === -1) {
      return res.status(404).json({ message: "Idea not found" });
    }
    
    demoIdeas[ideaIndex] = {
      ...demoIdeas[ideaIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.json(demoIdeas[ideaIndex]);
  } catch (error) {
    console.error("Error updating idea:", error);
    res.status(500).json({ message: "Failed to update idea" });
  }
});

app.delete("/api/ideas/:id", auth, async (req: any, res) => {
  try {
    const ideaIndex = demoIdeas.findIndex(idea => idea.id === req.params.id);
    if (ideaIndex === -1) {
      return res.status(404).json({ message: "Idea not found" });
    }
    
    demoIdeas.splice(ideaIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting idea:", error);
    res.status(500).json({ message: "Failed to delete idea" });
  }
});

// Groups routes
app.get("/api/groups", auth, async (req: any, res) => {
  try {
    res.json(demoGroups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
});

app.post("/api/groups", auth, async (req: any, res) => {
  try {
    const newGroup = {
      id: `group-${Date.now()}`,
      userId: req.user.id,
      name: req.body.name || 'New Group',
      color: req.body.color || 'blue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    demoGroups.push(newGroup);
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Failed to create group" });
  }
});

// Other required routes
app.get("/api/groups/:groupId/ideas", auth, async (req: any, res) => {
  try {
    const groupIdeas = demoIdeas.filter(idea => idea.groupId === req.params.groupId);
    res.json(groupIdeas);
  } catch (error) {
    console.error("Error fetching ideas by group:", error);
    res.status(500).json({ message: "Failed to fetch ideas by group" });
  }
});

app.get("/api/ideas/unassigned", auth, async (req: any, res) => {
  try {
    const unassignedIdeas = demoIdeas.filter(idea => !idea.groupId);
    res.json(unassignedIdeas);
  } catch (error) {
    console.error("Error fetching unassigned ideas:", error);
    res.status(500).json({ message: "Failed to fetch unassigned ideas" });
  }
});

(async () => {
  const { createServer } = await import("http");
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Setup vite in development
  try {
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  } catch (error) {
    console.error("Vite setup failed:", error);
    // Fallback: serve a simple message
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ message: "API endpoint not found" });
      }
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Clear Mind Demo</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
              .error { background: #fee; padding: 20px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>Clear Mind Demo</h1>
            <div class="error">
              <p>The frontend is not properly configured for this demo.</p>
              <p>The drag & drop coordinate fixes have been applied to the codebase.</p>
              <p>API endpoints are working at: <code>/api/ideas</code>, <code>/api/groups</code></p>
            </div>
          </body>
        </html>
      `);
    });
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();