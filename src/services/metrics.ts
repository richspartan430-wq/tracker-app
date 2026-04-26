import {
  AnalyticsSummary,
  AppSettings,
  DailyEntry,
  DateRange,
  DayAnalyticsPoint,
} from '../types/domain';
import { fromDateKey, listDateKeysInRange, parseTimeToMinutes, toDateKey } from '../utils/date';

function getEnabledQuestionCount(settings: AppSettings): number {
  const builtInCount = Object.values(settings.builtInHabitVisibility).filter(Boolean)
    .length;
  const customCount = settings.customQuestions.filter(question => question.enabled)
    .length;
  return builtInCount + customCount;
}

function getCompletedQuestionCount(entry: DailyEntry, settings: AppSettings): number {
  let completed = 0;

  (Object.keys(settings.builtInHabitVisibility) as Array<keyof AppSettings['builtInHabitVisibility']>).forEach(
    habitKey => {
      if (settings.builtInHabitVisibility[habitKey] && entry.builtInHabits[habitKey] === 'yes') {
        completed += 1;
      }
    },
  );

  settings.customQuestions.forEach(question => {
    if (question.enabled && entry.customHabits[question.id] === 'yes') {
      completed += 1;
    }
  });

  return completed;
}

function calculateSleepMinutes(entry: DailyEntry): number | undefined {
  const wakeMinutes = parseTimeToMinutes(entry.wakeTime);
  const sleepMinutes = parseTimeToMinutes(entry.sleepTime);

  if (wakeMinutes === undefined || sleepMinutes === undefined) {
    return undefined;
  }

  if (sleepMinutes >= wakeMinutes) {
    return sleepMinutes - wakeMinutes;
  }

  return 24 * 60 - wakeMinutes + sleepMinutes;
}

function calculateTotalReps(entry: DailyEntry): number {
  return Object.values(entry.exercises).reduce((total, value) => {
    const sets = value.sets ?? 0;
    const reps = value.reps ?? 0;
    if (!sets && !reps) {
      return total;
    }

    if (sets && reps) {
      return total + sets * reps;
    }

    return total + Math.max(sets, reps);
  }, 0);
}

function calculatePoint(
  dateKey: string,
  entry: DailyEntry | undefined,
  settings: AppSettings,
): DayAnalyticsPoint {
  if (!entry) {
    return {
      date: dateKey,
      completionRate: 0,
      totalCompleted: 0,
      totalExpected: getEnabledQuestionCount(settings),
      totalReps: 0,
    };
  }

  const totalExpected = getEnabledQuestionCount(settings);
  const totalCompleted = getCompletedQuestionCount(entry, settings);
  const completionRate =
    totalExpected > 0 ? (totalCompleted / totalExpected) * 100 : 0;

  return {
    date: dateKey,
    completionRate,
    totalCompleted,
    totalExpected,
    totalReps: calculateTotalReps(entry),
    steps: entry.steps,
    sleepMinutes: calculateSleepMinutes(entry),
    plannedCalories: entry.plannedCalories,
    trackedCalories: entry.trackedCalories,
  };
}

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function computeCurrentStreak(
  entriesByDate: Record<string, DailyEntry>,
  settings: AppSettings,
): number {
  let streak = 0;
  let cursor = new Date();

  while (true) {
    const dateKey = toDateKey(cursor);
    const entry = entriesByDate[dateKey];

    if (!entry) {
      break;
    }

    const expected = getEnabledQuestionCount(settings);
    if (expected === 0) {
      break;
    }

    const completed = getCompletedQuestionCount(entry, settings);
    const completionRate = (completed / expected) * 100;

    if (completionRate < 100) {
      break;
    }

    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}

export function buildAnalytics(
  entriesByDate: Record<string, DailyEntry>,
  settings: AppSettings,
  range: DateRange,
): { summary: AnalyticsSummary; points: DayAnalyticsPoint[] } {
  const dateKeys = listDateKeysInRange(range);
  const points = dateKeys.map(dateKey =>
    calculatePoint(dateKey, entriesByDate[dateKey], settings),
  );

  const validCompletionRates = points
    .filter(point => point.totalExpected > 0)
    .map(point => point.completionRate);

  const repDays = points.filter(point => point.totalReps > 0).length;
  const stepValues = points
    .map(point => point.steps)
    .filter((value): value is number => value !== undefined);
  const sleepValues = points
    .map(point => point.sleepMinutes)
    .filter((value): value is number => value !== undefined);
  const plannedCalories = points
    .map(point => point.plannedCalories)
    .filter((value): value is number => value !== undefined);
  const trackedCalories = points
    .map(point => point.trackedCalories)
    .filter((value): value is number => value !== undefined);

  const summary: AnalyticsSummary = {
    completionRate: average(validCompletionRates),
    currentStreak: computeCurrentStreak(entriesByDate, settings),
    totalReps: points.reduce((total, point) => total + point.totalReps, 0),
    exerciseConsistency: points.length ? (repDays / points.length) * 100 : 0,
    averageSteps: average(stepValues),
    averageSleepMinutes: average(sleepValues),
    averagePlannedCalories: average(plannedCalories),
    averageTrackedCalories: average(trackedCalories),
  };

  return { summary, points };
}

export function getRangeLabel(range: DateRange): string {
  const start = fromDateKey(range.startDate);
  const end = fromDateKey(range.endDate);
  return `${start.toDateString()} - ${end.toDateString()}`;
}
