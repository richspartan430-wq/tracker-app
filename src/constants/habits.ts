import {
  AppSettings,
  BuiltInHabitKey,
  DailyEntry,
  YesNoValue,
} from '../types/domain';

export const BUILT_IN_HABIT_LABELS: Record<BuiltInHabitKey, string> = {
  trataka: 'Did Trataka?',
  brushedTeeth: 'Brushed teeth?',
  washedFace: 'Washed face?',
  discipline: 'Did you stay disciplined today?',
};

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  builtInHabitVisibility: {
    trataka: true,
    brushedTeeth: true,
    washedFace: true,
    discipline: true,
  },
  disciplineQuestionLabel: BUILT_IN_HABIT_LABELS.discipline,
  customQuestions: [],
};

export const DEFAULT_BUILT_IN_RESPONSES: Record<BuiltInHabitKey, YesNoValue> = {
  trataka: null,
  brushedTeeth: null,
  washedFace: null,
  discipline: null,
};

export function createEmptyEntry(date: string, settings: AppSettings): DailyEntry {
  const customHabits: Record<string, YesNoValue> = {};

  settings.customQuestions.forEach(question => {
    customHabits[question.id] = null;
  });

  return {
    date,
    builtInHabits: { ...DEFAULT_BUILT_IN_RESPONSES },
    customHabits,
    exercises: {},
    photoUris: [],
    notes: '',
    updatedAt: Date.now(),
  };
}
