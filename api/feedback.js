import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { feedback, insertFeedbackSchemaDb } from '../shared/schema.js';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const validatedFeedback = insertFeedbackSchemaDb.parse(req.body);
      
      const [newFeedback] = await db
        .insert(feedback)
        .values(validatedFeedback)
        .returning();
      
      res.setHeader('Content-Type', 'application/json');
      return res.status(201).json(newFeedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ 
        error: "Invalid feedback data", 
        message: error?.message || "Unknown error occurred"
      });
    }
  }
  
  if (req.method === 'GET') {
    try {
      const allFeedback = await db
        .select()
        .from(feedback)
        .orderBy(feedback.createdAt);
      
      return res.json(allFeedback);
    } catch (error) {
      console.error("Error getting feedback:", error);
      return res.status(500).json({ error: "Failed to retrieve feedback" });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}