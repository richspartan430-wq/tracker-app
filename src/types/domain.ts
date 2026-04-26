export type ThemeMode = 'system' | 'light' | 'dark';

export type YesNoValue = 'yes' | 'no' | null;

export type BuiltInHabitKey =
  | 'trataka'
  | 'brushedTeeth'
  | 'washedFace'
  | 'discipline';

export interface HabitQuestion {
  id: string;
  label: string;
  enabled: boolean;
  builtIn?: boolean;
}

export interface ExerciseDefinition {
  key: string;
  label: string;
  group: 'pushups' | 'upperBody' | 'legs';
}

export interface ExerciseLog {
  sets?: number;
  reps?: number;
}

export interface DailyEntry {
  date: string;
  wakeTime?: string;
  sleepTime?: string;
  plannedCalories?: number;
  trackedCalories?: number;
  steps?: number;
  builtInHabits: Record<BuiltInHabitKey, YesNoValue>;
  customHabits: Record<string, YesNoValue>;
  exercises: Record<string, ExerciseLog>;
  notes?: string;
  photoUris: string[];
  updatedAt: number;
}

export interface AppSettings {
  themeMode: ThemeMode;
  builtInHabitVisibility: Record<BuiltInHabitKey, boolean>;
  disciplineQuestionLabel: string;
  customQuestions: HabitQuestion[];
}

export interface AppBackup {
  schemaVersion: number;
  exportedAt: string;
  settings: AppSettings;
  entries: DailyEntry[];
}

export type AnalyticsFilter = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DayAnalyticsPoint {
  date: string;
  completionRate: number;
  totalCompleted: number;
  totalExpected: number;
  totalReps: number;
  steps?: number;
  sleepMinutes?: number;
  plannedCalories?: number;
  trackedCalories?: number;
}

export interface AnalyticsSummary {
  completionRate: number;
  currentStreak: number;
  totalReps: number;
  exerciseConsistency: number;
  averageSteps: number;
  averageSleepMinutes: number;
  averagePlannedCalories: number;
  averageTrackedCalories: number;
}
