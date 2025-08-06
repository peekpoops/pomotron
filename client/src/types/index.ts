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
