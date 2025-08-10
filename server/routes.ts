import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFeedbackSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add OPTIONS handler for CORS preflight (Safari compatibility)
  app.options("/api/*", (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
  });

  // Health check
  app.get("/api/health", async (req, res) => {
    const isHealthy = await storage.healthCheck();
    res.json({ status: isHealthy ? "ok" : "error" });
  });

  // Feedback routes with Safari compatibility
  app.post("/api/feedback", async (req, res) => {
    try {
      console.log("Received feedback request:", req.body);
      
      // Add CORS headers for Safari compatibility
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      const validatedFeedback = insertFeedbackSchema.parse(req.body);
      console.log("Validated feedback:", validatedFeedback);
      
      const feedback = await storage.createFeedback(validatedFeedback);
      console.log("Created feedback:", feedback);
      
      // Ensure proper JSON response for Safari
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(feedback);
    } catch (error: any) {
      console.error("Error creating feedback:", error);
      console.error("Error stack:", error?.stack);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        error: "Failed to create feedback", 
        message: error?.message || "Unknown error occurred",
        details: error?.issues || undefined
      });
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
