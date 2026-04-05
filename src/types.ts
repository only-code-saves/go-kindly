export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export type RepetitionType = 'none' | 'today' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'trimonthly' | 'quarterly' | 'semiannual';

export interface Task {
  id: string;
  title: string;
  energyLevel: EnergyLevel;
  durationMinutes: number;
  category: string;
  completed: boolean;
  scheduledDate: string; // ISO string — date task was created / start date
  scheduledTime?: string; // HH:mm
  repetition?: {
    type: RepetitionType;
    days?: number[]; // 0-6 for Sunday-Saturday (used with 'weekly')
  };
  deadline?: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm — end date for repeating tasks
  deletedInstances?: string[]; // toDateString() values of deleted occurrences
  completedDate?: string;
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
