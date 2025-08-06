// Simple in-memory storage for Pomotron
// Currently not implementing user authentication - all data is client-side

export interface IStorage {
  // Placeholder for future storage methods
  healthCheck(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize storage
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export const storage = new MemStorage();
