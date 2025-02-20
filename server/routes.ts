import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema } from "@shared/schema";
import { getSuggestions } from "./ai";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const tasks = await storage.getTasks(req.user!.id);
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const result = insertTaskSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const task = await storage.createTask({
      ...result.data,
      userId: req.user!.id,
    });
    res.json(task);
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const id = parseInt(req.params.id);
    const result = insertTaskSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const task = await storage.updateTask(id, result.data);
    res.json(task);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const id = parseInt(req.params.id);
    await storage.deleteTask(id);
    res.status(204).end();
  });

  app.post("/api/suggestions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { task } = req.body;
    if (!task || typeof task !== "string") {
      return res.status(400).json({ error: "Task text required" });
    }
    const suggestions = await getSuggestions(task);
    res.json({ suggestions });
  });

  const httpServer = createServer(app);
  return httpServer;
}