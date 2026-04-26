import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { EXERCISE_DEFINITIONS, EXERCISE_GROUPS } from '../constants/exercises';
import { BUILT_IN_HABIT_LABELS, createEmptyEntry } from '../constants/habits';
import { persistPickedPhotos } from '../services/photos';
import { useAppStore } from '../state/useAppStore';
import { BuiltInHabitKey } from '../types/domain';
import {
  formatReadableDate,
  formatTimeValue,
  fromDateKey,
  getNextDateKey,
  getPreviousDateKey,
} from '../utils/date';
import { getPalette } from '../utils/theme';
import {
  ActionButton,
  AppCard,
  NumberInputField,
  SectionTitle,
  YesNoToggle,
} from '../components/ui';

function getTimePickerDate(value?: string): Date {
  const base = new Date();
  if (!value || !value.includes(':')) {
    return base;
  }

  const [hours, minutes] = value.split(':').map(Number);
  base.setHours(Number.isNaN(hours) ? 0 : hours);
  base.setMinutes(Number.isNaN(minutes) ? 0 : minutes);
  base.setSeconds(0);
  return base;
}

function saveStatusLabel(saveStatus: string, lastSavedAt?: number): string {
  if (saveStatus === 'saving') {
    return 'Auto-saving...';
  }

  if (saveStatus === 'error') {
    return 'Auto-save error';
  }

  if (lastSavedAt) {
    return `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`;
  }

  return 'Ready';
}

export function DailyLogScreen(): React.JSX.Element {
  const initialized = useAppStore(state => state.initialized);
  const selectedDate = useAppStore(state => state.selectedDate);
  const settings = useAppStore(state => state.settings);
  const entries = useAppStore(state => state.entries);
  const setSelectedDate = useAppStore(state => state.setSelectedDate);
  const setWakeTime = useAppStore(state => state.setWakeTime);
  const setSleepTime = useAppStore(state => state.setSleepTime);
  const setPlannedCalories = useAppStore(state => state.setPlannedCalories);
  const setTrackedCalories = useAppStore(state => state.setTrackedCalories);
  const setSteps = useAppStore(state => state.setSteps);
  const setBuiltInHabitResponse = useAppStore(
    state => state.setBuiltInHabitResponse,
  );
  const setCustomHabitResponse = useAppStore(
    state => state.setCustomHabitResponse,
  );
  const setExerciseValue = useAppStore(state => state.setExerciseValue);
  const setNotes = useAppStore(state => state.setNotes);
  const addPhotoUris = useAppStore(state => state.addPhotoUris);
  const removePhotoUri = useAppStore(state => state.removePhotoUri);
  const saveStatus = useAppStore(state => state.saveStatus);
  const lastSavedAt = useAppStore(state => state.lastSavedAt);

  const systemColorScheme = useColorScheme();
  const palette = getPalette(settings.themeMode, systemColorScheme);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);
  const [showSleepTimePicker, setShowSleepTimePicker] = useState(false);

  const entry = useMemo(() => {
    return entries[selectedDate] || createEmptyEntry(selectedDate, settings);
  }, [entries, selectedDate, settings]);

  const handleDateChange = (
    event: DateTimePickerEvent,
    selected?: Date,
  ): void => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' && selected) {
      setSelectedDate(
        `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`,
      );
    }
  };

  const handleTimeSelection = (
    event: DateTimePickerEvent,
    selected: Date | undefined,
    target: 'wake' | 'sleep',
  ): void => {
    if (Platform.OS === 'android') {
      if (target === 'wake') {
        setShowWakeTimePicker(false);
      } else {
        setShowSleepTimePicker(false);
      }
    }

    if (event.type === 'set' && selected) {
      const formatted = formatTimeValue(selected);
      if (target === 'wake') {
        setWakeTime(formatted);
      } else {
        setSleepTime(formatted);
      }
    }
  };

  const handleAddPhotos = async (): Promise<void> => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 0,
      });

      if (result.didCancel || !result.assets?.length) {
        return;
      }

      const persisted = await persistPickedPhotos(result.assets);
      if (!persisted.length) {
        return;
      }

      addPhotoUris(persisted);
    } catch {
      Alert.alert('Photo error', 'Could not add photos right now.');
    }
  };

  const renderHabitToggle = (
    key: BuiltInHabitKey,
    label: string,
  ): React.JSX.Element | null => {
    if (!settings.builtInHabitVisibility[key]) {
      return null;
    }

    return (
      <View key={key} style={styles.questionRow}>
        <Text style={[styles.questionLabel, { color: palette.text }]}>{label}</Text>
        <YesNoToggle
          palette={palette}
          value={entry.builtInHabits[key]}
          onChange={value => setBuiltInHabitResponse(key, value)}
        />
      </View>
    );
  };

  if (!initialized) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.text }}>Loading tracker...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.contentContainer}>
      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Daily Log" />
        <Text style={[styles.dateLabel, { color: palette.text }]}>
          {formatReadableDate(selectedDate)}
        </Text>
        <Text style={[styles.statusLabel, { color: palette.mutedText }]}>
          {saveStatusLabel(saveStatus, lastSavedAt)}
        </Text>
        <View style={styles.headerActions}>
          <ActionButton
            palette={palette}
            label="Previous"
            variant="secondary"
            onPress={() => setSelectedDate(getPreviousDateKey(selectedDate))}
          />
          <ActionButton
            palette={palette}
            label="Pick Date"
            onPress={() => setShowDatePicker(true)}
          />
          <ActionButton
            palette={palette}
            label="Next"
            variant="secondary"
            onPress={() => setSelectedDate(getNextDateKey(selectedDate))}
          />
        </View>
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Morning" />
        <View style={styles.inlineRow}>
          <Text style={[styles.inlineLabel, { color: palette.text }]}>Wake-up time</Text>
          <ActionButton
            palette={palette}
            label={entry.wakeTime || 'Set time'}
            variant="secondary"
            onPress={() => setShowWakeTimePicker(true)}
          />
        </View>
        {renderHabitToggle('trataka', BUILT_IN_HABIT_LABELS.trataka)}
        <Text style={[styles.inputLabel, { color: palette.text }]}>Expected calories</Text>
        <NumberInputField
          palette={palette}
          value={entry.plannedCalories}
          placeholder="Optional"
          onChange={setPlannedCalories}
        />
        <Text style={[styles.inputLabel, { color: palette.text }]}>Tracked calories</Text>
        <NumberInputField
          palette={palette}
          value={entry.trackedCalories}
          placeholder="Optional"
          onChange={setTrackedCalories}
        />
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Fitness" />
        <Text style={[styles.inputLabel, { color: palette.text }]}>Steps</Text>
        <NumberInputField
          palette={palette}
          value={entry.steps}
          placeholder="Optional"
          onChange={setSteps}
        />
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Exercise" />
        {EXERCISE_GROUPS.map(group => (
          <View key={group.id} style={styles.exerciseGroup}>
            <Text style={[styles.groupTitle, { color: palette.accent }]}>{group.title}</Text>
            {EXERCISE_DEFINITIONS.filter(item => item.group === group.id).map(item => (
              <View key={item.key} style={styles.exerciseRow}>
                <Text style={[styles.exerciseLabel, { color: palette.text }]}>{item.label}</Text>
                <View style={styles.exerciseInputs}>
                  <View style={styles.exerciseInputColumn}>
                    <Text style={[styles.smallLabel, { color: palette.mutedText }]}>Sets</Text>
                    <NumberInputField
                      palette={palette}
                      value={entry.exercises[item.key]?.sets}
                      placeholder="0"
                      onChange={value => setExerciseValue(item.key, 'sets', value)}
                    />
                  </View>
                  <View style={styles.exerciseInputColumn}>
                    <Text style={[styles.smallLabel, { color: palette.mutedText }]}>Reps</Text>
                    <NumberInputField
                      palette={palette}
                      value={entry.exercises[item.key]?.reps}
                      placeholder="0"
                      onChange={value => setExerciseValue(item.key, 'reps', value)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Night Routine" />
        {renderHabitToggle('brushedTeeth', BUILT_IN_HABIT_LABELS.brushedTeeth)}
        {renderHabitToggle('washedFace', BUILT_IN_HABIT_LABELS.washedFace)}
        <View style={styles.inlineRow}>
          <Text style={[styles.inlineLabel, { color: palette.text }]}>Sleep time</Text>
          <ActionButton
            palette={palette}
            label={entry.sleepTime || 'Set time'}
            variant="secondary"
            onPress={() => setShowSleepTimePicker(true)}
          />
        </View>
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Personal Habits" />
        {settings.builtInHabitVisibility.discipline && (
          <View style={styles.questionRow}>
            <Text style={[styles.questionLabel, { color: palette.text }]}>
              {settings.disciplineQuestionLabel}
            </Text>
            <YesNoToggle
              palette={palette}
              value={entry.builtInHabits.discipline}
              onChange={value => setBuiltInHabitResponse('discipline', value)}
            />
          </View>
        )}

        {settings.customQuestions
          .filter(question => question.enabled)
          .map(question => (
            <View key={question.id} style={styles.questionRow}>
              <Text style={[styles.questionLabel, { color: palette.text }]}>{question.label}</Text>
              <YesNoToggle
                palette={palette}
                value={entry.customHabits[question.id] ?? null}
                onChange={value => setCustomHabitResponse(question.id, value)}
              />
            </View>
          ))}
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Daily Photo Log" />
        <ActionButton palette={palette} label="Add Photos" onPress={handleAddPhotos} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
          {entry.photoUris.length === 0 ? (
            <Text style={{ color: palette.mutedText }}>No photos added yet.</Text>
          ) : (
            entry.photoUris.map(uri => (
              <View key={uri} style={styles.photoTile}>
                <Image source={{ uri }} style={styles.photo} />
                <Pressable
                  style={[styles.removePhotoButton, { backgroundColor: palette.danger }]}
                  onPress={() => removePhotoUri(uri)}>
                  <Text style={styles.removePhotoText}>Remove</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Notes" />
        <TextInput
          multiline
          value={entry.notes || ''}
          onChangeText={setNotes}
          placeholder="Write your journal notes..."
          placeholderTextColor={palette.mutedText}
          style={[
            styles.notesInput,
            {
              borderColor: palette.border,
              color: palette.text,
              backgroundColor: palette.background,
            },
          ]}
        />
      </AppCard>

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          value={fromDateKey(selectedDate)}
          onChange={handleDateChange}
        />
      )}

      {showWakeTimePicker && (
        <DateTimePicker
          mode="time"
          value={getTimePickerDate(entry.wakeTime)}
          onChange={(event, dateValue) =>
            handleTimeSelection(event, dateValue, 'wake')
          }
        />
      )}

      {showSleepTimePicker && (
        <DateTimePicker
          mode="time"
          value={getTimePickerDate(entry.sleepTime)}
          onChange={(event, dateValue) =>
            handleTimeSelection(event, dateValue, 'sleep')
          }
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineRow: {
    marginBottom: 10,
    gap: 8,
  },
  inlineLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
    marginTop: 8,
    fontWeight: '600',
  },
  questionRow: {
    marginBottom: 12,
    gap: 8,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseGroup: {
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  exerciseRow: {
    marginBottom: 12,
    gap: 7,
  },
  exerciseLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseInputColumn: {
    flex: 1,
    gap: 4,
  },
  smallLabel: {
    fontSize: 12,
  },
  photoStrip: {
    marginTop: 12,
  },
  photoTile: {
    marginRight: 10,
    alignItems: 'center',
    gap: 6,
  },
  photo: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  removePhotoButton: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 120,
    textAlignVertical: 'top',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
