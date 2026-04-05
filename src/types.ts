export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export type RepetitionType = 'none' | 'today' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'trimonthly' | 'quarterly' | 'semiannual' | 'annual';

export interface Task {
  id: string;
  title: string;
  energyLevel: EnergyLevel;
  durationMinutes: number;
  category: string;
  completed: boolean;
  scheduledDate: string; // ISO string
  scheduledTime?: string; // HH:mm
  repetition?: {
    type: RepetitionType;
    days?: number[]; // 0-6 for Sunday-Saturday
  };
  deadline?: string; // ISO string
  deletedInstances?: string[]; // Array of ISO date strings (YYYY-MM-DD)
  completedDate?: string; // ISO string
  isOverdue?: boolean;
  observation?: string;
}

export interface SerendipityActivity {
  id: string;
  title: string;
  category: string;
  icon: string;
}

export type AppView = 'home' | 'serendipity' | 'agenda' | 'journey' | 'add-task' | 'focus';
