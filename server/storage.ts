import { Feedback, InsertFeedback } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  healthCheck(): Promise<boolean>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getAllFeedback(): Promise<Feedback[]>;
}

export class MemStorage implements IStorage {
  private feedback: Feedback[] = [];

  constructor() {
    // Initialize storage
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const feedback: Feedback = {
      id: nanoid(),
      rating: insertFeedback.rating,
      comment: insertFeedback.comment,
      createdAt: new Date(),
    };
    
    this.feedback.push(feedback);
    return feedback;
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return [...this.feedback].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
