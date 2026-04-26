import {
  addDays,
  endOfMonth,
  format,
  parse,
  startOfMonth,
  subDays,
} from 'date-fns';
import { AnalyticsFilter, DateRange } from '../types/domain';

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromDateKey(dateKey: string): Date {
  return parse(dateKey, 'yyyy-MM-dd', new Date());
}

export function formatReadableDate(dateKey: string): string {
  return format(fromDateKey(dateKey), 'EEE, MMM d, yyyy');
}

export function getDefaultDateRange(
  filter: AnalyticsFilter,
  anchorDateKey: string,
): DateRange {
  const anchorDate = fromDateKey(anchorDateKey);

  if (filter === 'daily') {
    return { startDate: anchorDateKey, endDate: anchorDateKey };
  }

  if (filter === 'weekly') {
    return {
      startDate: toDateKey(subDays(anchorDate, 6)),
      endDate: anchorDateKey,
    };
  }

  if (filter === 'monthly') {
    return {
      startDate: toDateKey(startOfMonth(anchorDate)),
      endDate: toDateKey(endOfMonth(anchorDate)),
    };
  }

  return {
    startDate: toDateKey(subDays(anchorDate, 29)),
    endDate: anchorDateKey,
  };
}

export function listDateKeysInRange(range: DateRange): string[] {
  const start = fromDateKey(range.startDate);
  const end = fromDateKey(range.endDate);
  const keys: string[] = [];

  let current = start;
  while (current <= end) {
    keys.push(toDateKey(current));
    current = addDays(current, 1);
  }

  return keys;
}

export function getPreviousDateKey(dateKey: string): string {
  return toDateKey(subDays(fromDateKey(dateKey), 1));
}

export function getNextDateKey(dateKey: string): string {
  return toDateKey(addDays(fromDateKey(dateKey), 1));
}

export function parseTimeToMinutes(timeValue?: string): number | undefined {
  if (!timeValue || !timeValue.includes(':')) {
    return undefined;
  }

  const [hour, minute] = timeValue.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return undefined;
  }

  return hour * 60 + minute;
}

export function formatMinutesToTimeLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function formatTimeValue(date: Date): string {
  return format(date, 'HH:mm');
}
