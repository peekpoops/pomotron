import { z } from "zod";

// Session Schema
export const sessionSchema = z.object({
  id: z.string(),
  task: z.string(),
  why: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number(), // in seconds
  completed: z.boolean(),
  sessionType: z.enum(['focus', 'break', 'longBreak']),
  cycleNumber: z.number(),
});

export const insertSessionSchema = sessionSchema.omit({ id: true });

export type Session = z.infer<typeof sessionSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Settings Schema
export const settingsSchema = z.object({
  focusDuration: z.number().min(1).max(120).default(25), // minutes
  breakDuration: z.number().min(1).max(60).default(5), // minutes
  longBreakDuration: z.number().min(1).max(120).default(15), // minutes
  cyclesBeforeLongBreak: z.number().min(1).max(10).default(4),
  autoStart: z.boolean().default(false),
  softStart: z.boolean().default(false),
  idleTimeout: z.number().min(1).max(60).default(5), // minutes
  theme: z.enum(['starcourt', 'minimal', 'ghibli']).default('starcourt'),
  websiteBlockingEnabled: z.boolean().default(true),
  frictionOverride: z.boolean().default(false),
  blockedSites: z.array(z.string()).default([]),
});

export type Settings = z.infer<typeof settingsSchema>;

// Analytics Schema
export const analyticsSchema = z.object({
  totalSessions: z.number().default(0),
  completedSessions: z.number().default(0),
  totalFocusTime: z.number().default(0), // in seconds
  currentStreak: z.number().default(0), // days
  lastSessionDate: z.date().optional(),
  weeklyData: z.array(z.object({
    date: z.string(),
    sessions: z.number(),
    focusTime: z.number(),
  })).default([]),
});

export type Analytics = z.infer<typeof analyticsSchema>;

// Timer State Schema
export const timerStateSchema = z.object({
  isRunning: z.boolean().default(false),
  isPaused: z.boolean().default(false),
  timeLeft: z.number().default(1500), // 25 minutes in seconds
  sessionType: z.enum(['focus', 'break', 'longBreak']).default('focus'),
  currentCycle: z.number().default(1),
  currentSessionId: z.string().optional(),
  currentIntention: z.object({
    task: z.string().default(''),
    why: z.string().default(''),
  }).default({ task: '', why: '' }),
  startTime: z.number().nullable().default(null), // timestamp when timer started
});

export type TimerState = z.infer<typeof timerStateSchema>;
