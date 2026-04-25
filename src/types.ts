export interface User {
  id: string;
  name: string;
  email: string;
  dateOfBirth?: string;
  preferredLanguage: string;
  createdAt: Date;
}

export interface UserProfile {
  height?: number;
  weight?: number;
  menarche?: number;
  avgCycleLength: number;
  avgPeriodLength: number;
  lastPeriodDate?: Date;
  birthControl?: string;
  cycleRegularity?: string;
  dietary_restrictions?: string;
  exercise_frequency?: string;
}

export interface CycleLog {
  id: string;
  date: Date;
  isFirstDay: boolean;
  flowIntensity?: 'none' | 'light' | 'medium' | 'heavy';
  symptoms: string[];
  mood?: string;
  energyLevel?: number;
  notes?: string;
}

export interface PCODScreening {
  id: string;
  answers: Record<string, any>;
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  breakdown: Record<string, number>;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  flagged: boolean;
  createdAt: Date;
}
