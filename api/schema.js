const { pgTable, text, timestamp, integer, boolean } = require('drizzle-orm/pg-core');
const { createInsertSchema } = require('drizzle-zod');

// Feedback table
const feedback = pgTable('feedback', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

// Insert schema for feedback
const insertFeedbackSchemaDb = createInsertSchema(feedback).omit({
  id: true,
  timestamp: true,
});

// User table (for future auth)
const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

module.exports = {
  feedback,
  insertFeedbackSchemaDb,
  users,
  insertUserSchema,
};