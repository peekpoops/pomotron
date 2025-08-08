import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFeedbackSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", async (req, res) => {
    const isHealthy = await storage.healthCheck();
    res.json({ status: isHealthy ? "ok" : "error" });
  });

  // Feedback routes
  app.post("/api/feedback", async (req, res) => {
    try {
      const validatedFeedback = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback(validatedFeedback);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(400).json({ error: "Invalid feedback data" });
    }
  });

  app.get("/api/feedback", async (req, res) => {
    try {
      const feedback = await storage.getAllFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Error getting feedback:", error);
      res.status(500).json({ error: "Failed to retrieve feedback" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
