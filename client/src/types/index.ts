export * from "@shared/schema";

export interface Quote {
  text: string;
  author: string;
}

export interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
}

export type Theme = 'starcourt' | 'minimal' | 'ghibli';

export type ViewType = 'timer' | 'analytics' | 'settings';

export interface Settings {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
  autoStart: boolean;
  softStart: boolean;

  theme: Theme;
  websiteBlockingEnabled: boolean;
  frictionOverride: boolean;
  blockedSites: string[];
  showQuotes: boolean;
  soundsEnabled: boolean;
  motivationalQuotesEnabled: boolean;
}