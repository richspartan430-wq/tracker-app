import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_SETTINGS, createEmptyEntry } from '../constants/habits';
import {
  clearDatabase,
  initDatabase,
  loadAllEntries,
  loadSettings,
  saveEntriesBulk,
  saveEntry,
  saveSettings,
} from '../db/database';
import { exportBackupFile, importBackupFile } from '../services/backup';
import {
  AppSettings,
  BuiltInHabitKey,
  DailyEntry,
  ThemeMode,
  YesNoValue,
} from '../types/domain';
import { getDefaultDateRange, toDateKey } from '../utils/date';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AppState {
  initialized: boolean;
  selectedDate: string;
  customRange: { startDate: string; endDate: string };
  entries: Record<string, DailyEntry>;
  settings: AppSettings;
  saveStatus: SaveStatus;
  lastSavedAt?: number;
  init: () => Promise<void>;
  setSelectedDate: (dateKey: string) => void;
  setCustomRange: (startDate: string, endDate: string) => void;
  setWakeTime: (time?: string) => void;
  setSleepTime: (time?: string) => void;
  setPlannedCalories: (value?: number) => void;
  setTrackedCalories: (value?: number) => void;
  setSteps: (value?: number) => void;
  setBuiltInHabitResponse: (key: BuiltInHabitKey, value: YesNoValue) => void;
  setCustomHabitResponse: (questionId: string, value: YesNoValue) => void;
  setExerciseValue: (
    exerciseKey: string,
    field: 'sets' | 'reps',
    value?: number,
  ) => void;
  setNotes: (value: string) => void;
  addPhotoUris: (uris: string[]) => void;
  removePhotoUri: (uri: string) => void;
  toggleBuiltInHabitVisibility: (
    key: BuiltInHabitKey,
    enabled: boolean,
  ) => void;
  setDisciplineQuestionLabel: (label: string) => void;
  addCustomQuestion: (label: string) => void;
  renameCustomQuestion: (questionId: string, label: string) => void;
  toggleCustomQuestion: (questionId: string, enabled: boolean) => void;
  deleteCustomQuestion: (questionId: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  exportData: () => Promise<string>;
  importData: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

let entrySaveTimer: ReturnType<typeof setTimeout> | null = null;
let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null;

function normalizeEntry(entry: DailyEntry, settings: AppSettings): DailyEntry {
  const normalized = {
    ...entry,
    customHabits: { ...entry.customHabits },
  };

  settings.customQuestions.forEach(question => {
    if (!(question.id in normalized.customHabits)) {
      normalized.customHabits[question.id] = null;
    }
  });

  return normalized;
}

function cloneSettings(settings: AppSettings): AppSettings {
  return {
    themeMode: settings.themeMode,
    builtInHabitVisibility: { ...settings.builtInHabitVisibility },
    disciplineQuestionLabel: settings.disciplineQuestionLabel,
    customQuestions: settings.customQuestions.map(question => ({ ...question })),
  };
}

function scheduleEntrySave(
  entry: DailyEntry,
  set: (partial: Partial<AppState>) => void,
): void {
  if (entrySaveTimer) {
    clearTimeout(entrySaveTimer);
  }

  set({ saveStatus: 'saving' });

  entrySaveTimer = setTimeout(async () => {
    try {
      await saveEntry(entry);
      set({ saveStatus: 'saved', lastSavedAt: Date.now() });
    } catch (error) {
      console.warn('Entry autosave failed', error);
      set({ saveStatus: 'error' });
    }
  }, 350);
}

function scheduleSettingsSave(
  settings: AppSettings,
  set: (partial: Partial<AppState>) => void,
): void {
  if (settingsSaveTimer) {
    clearTimeout(settingsSaveTimer);
  }

  settingsSaveTimer = setTimeout(async () => {
    try {
      await saveSettings(settings);
      set({ lastSavedAt: Date.now() });
    } catch (error) {
      console.warn('Settings autosave failed', error);
      set({ saveStatus: 'error' });
    }
  }, 300);
}

function ensureEntry(
  dateKey: string,
  entries: Record<string, DailyEntry>,
  settings: AppSettings,
): DailyEntry {
  const entry = entries[dateKey] || createEmptyEntry(dateKey, settings);
  return normalizeEntry(entry, settings);
}

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  selectedDate: toDateKey(new Date()),
  customRange: getDefaultDateRange('weekly', toDateKey(new Date())),
  entries: {},
  settings: DEFAULT_SETTINGS,
  saveStatus: 'idle',
  lastSavedAt: undefined,

  init: async () => {
    if (get().initialized) {
      return;
    }

    await initDatabase();

    const [loadedSettings, loadedEntries] = await Promise.all([
      loadSettings(),
      loadAllEntries(),
    ]);

    const settings = loadedSettings ? cloneSettings(loadedSettings) : DEFAULT_SETTINGS;

    if (!loadedSettings) {
      await saveSettings(settings);
    }

    const today = toDateKey(new Date());
    const mappedEntries: Record<string, DailyEntry> = {};

    loadedEntries.forEach(entry => {
      mappedEntries[entry.date] = normalizeEntry(entry, settings);
    });

    if (!mappedEntries[today]) {
      mappedEntries[today] = createEmptyEntry(today, settings);
    }

    set({
      initialized: true,
      settings,
      entries: mappedEntries,
      selectedDate: today,
      customRange: getDefaultDateRange('weekly', today),
      saveStatus: 'idle',
    });
  },

  setSelectedDate: dateKey => {
    const { entries, settings } = get();
    const currentEntry = ensureEntry(dateKey, entries, settings);

    set(state => ({
      selectedDate: dateKey,
      entries: {
        ...state.entries,
        [dateKey]: currentEntry,
      },
      customRange: getDefaultDateRange('weekly', dateKey),
    }));
  },

  setCustomRange: (startDate, endDate) => {
    set({ customRange: { startDate, endDate } });
  },

  setWakeTime: time => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);
    const next: DailyEntry = {
      ...current,
      wakeTime: time,
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  setSleepTime: time => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);
    const next: DailyEntry = {
      ...current,
      sleepTime: time,
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  setPlannedCalories: value => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);
    const next: DailyEntry = {
      ...current,
      plannedCalories: value,
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  setTrackedCalories: value => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);
    const next: DailyEntry = {
      ...current,
      trackedCalories: value,
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  setSteps: value => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);
    const next: DailyEntry = {
      ...current,
      steps: value,
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  setBuiltInHabitResponse: (key, value) => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);

    const next: DailyEntry = {
      ...current,
      builtInHabits: {
        ...current.builtInHabits,
        [key]: value,
      },
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  setCustomHabitResponse: (questionId, value) => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);

    const next: DailyEntry = {
      ...current,
      customHabits: {
        ...current.customHabits,
        [questionId]: value,
      },
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  setExerciseValue: (exerciseKey, field, value) => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);
    const existingExercise = current.exercises[exerciseKey] || {};

    const next: DailyEntry = {
      ...current,
      exercises: {
        ...current.exercises,
        [exerciseKey]: {
          ...existingExercise,
          [field]: value,
        },
      },
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  setNotes: value => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);

    const next: DailyEntry = {
      ...current,
      notes: value,
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  addPhotoUris: uris => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);

    const next: DailyEntry = {
      ...current,
      photoUris: [...current.photoUris, ...uris],
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  removePhotoUri: uri => {
    const state = get();
    const current = ensureEntry(state.selectedDate, state.entries, state.settings);

    const next: DailyEntry = {
      ...current,
      photoUris: current.photoUris.filter(value => value !== uri),
      updatedAt: Date.now(),
    };

    set(prev => ({ entries: { ...prev.entries, [prev.selectedDate]: next } }));
    scheduleEntrySave(next, set);
  },

  toggleBuiltInHabitVisibility: (key, enabled) => {
    const state = get();
    const settings = cloneSettings(state.settings);
    settings.builtInHabitVisibility[key] = enabled;

    set({ settings });
    scheduleSettingsSave(settings, set);
  },

  setDisciplineQuestionLabel: label => {
    const state = get();
    const settings = cloneSettings(state.settings);
    settings.disciplineQuestionLabel = label;

    set({ settings });
    scheduleSettingsSave(settings, set);
  },

  addCustomQuestion: label => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      return;
    }

    const state = get();
    const settings = cloneSettings(state.settings);

    settings.customQuestions.push({
      id: uuidv4(),
      label: trimmedLabel,
      enabled: true,
    });

    const latestQuestion = settings.customQuestions[settings.customQuestions.length - 1];
    const updatedEntries: Record<string, DailyEntry> = {};

    Object.values(state.entries).forEach(entry => {
      updatedEntries[entry.date] = {
        ...entry,
        customHabits: {
          ...entry.customHabits,
          [latestQuestion.id]: null,
        },
        updatedAt: Date.now(),
      };
    });

    set({ settings, entries: updatedEntries });

    scheduleSettingsSave(settings, set);
    saveEntriesBulk(Object.values(updatedEntries)).catch(error => {
      console.warn('Failed to persist question updates', error);
      set({ saveStatus: 'error' });
    });
  },

  renameCustomQuestion: (questionId, label) => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      return;
    }

    const state = get();
    const settings = cloneSettings(state.settings);

    settings.customQuestions = settings.customQuestions.map(question =>
      question.id === questionId ? { ...question, label: trimmedLabel } : question,
    );

    set({ settings });
    scheduleSettingsSave(settings, set);
  },

  toggleCustomQuestion: (questionId, enabled) => {
    const state = get();
    const settings = cloneSettings(state.settings);

    settings.customQuestions = settings.customQuestions.map(question =>
      question.id === questionId ? { ...question, enabled } : question,
    );

    set({ settings });
    scheduleSettingsSave(settings, set);
  },

  deleteCustomQuestion: questionId => {
    const state = get();
    const settings = cloneSettings(state.settings);

    settings.customQuestions = settings.customQuestions.filter(
      question => question.id !== questionId,
    );

    const updatedEntries: Record<string, DailyEntry> = {};
    Object.values(state.entries).forEach(entry => {
      const customHabits = { ...entry.customHabits };
      delete customHabits[questionId];

      updatedEntries[entry.date] = {
        ...entry,
        customHabits,
        updatedAt: Date.now(),
      };
    });

    set({ settings, entries: updatedEntries });
    scheduleSettingsSave(settings, set);
    saveEntriesBulk(Object.values(updatedEntries)).catch(error => {
      console.warn('Failed to persist question deletion updates', error);
      set({ saveStatus: 'error' });
    });
  },

  setThemeMode: mode => {
    const state = get();
    const settings = cloneSettings(state.settings);
    settings.themeMode = mode;

    set({ settings });
    scheduleSettingsSave(settings, set);
  },

  exportData: async () => {
    const state = get();

    return exportBackupFile(state.settings, Object.values(state.entries));
  },

  importData: async () => {
    const backup = await importBackupFile();
    const settings = cloneSettings(backup.settings);

    const mappedEntries: Record<string, DailyEntry> = {};
    backup.entries.forEach(entry => {
      mappedEntries[entry.date] = normalizeEntry(entry, settings);
    });

    const today = toDateKey(new Date());
    if (!mappedEntries[today]) {
      mappedEntries[today] = createEmptyEntry(today, settings);
    }

    await clearDatabase();
    await saveSettings(settings);
    await saveEntriesBulk(Object.values(mappedEntries));

    set({
      settings,
      entries: mappedEntries,
      selectedDate: today,
      customRange: getDefaultDateRange('weekly', today),
      saveStatus: 'saved',
      lastSavedAt: Date.now(),
    });
  },

  resetAllData: async () => {
    const today = toDateKey(new Date());
    const freshEntry = createEmptyEntry(today, DEFAULT_SETTINGS);

    await clearDatabase();
    await saveSettings(DEFAULT_SETTINGS);
    await saveEntry(freshEntry);

    set({
      settings: DEFAULT_SETTINGS,
      entries: { [today]: freshEntry },
      selectedDate: today,
      customRange: getDefaultDateRange('weekly', today),
      saveStatus: 'saved',
      lastSavedAt: Date.now(),
    });
  },
}));
