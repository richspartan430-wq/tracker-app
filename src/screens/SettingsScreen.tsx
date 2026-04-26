import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { BUILT_IN_HABIT_LABELS } from '../constants/habits';
import { isImportCancelled } from '../services/backup';
import { useAppStore } from '../state/useAppStore';
import { ThemeMode } from '../types/domain';
import { getPalette } from '../utils/theme';
import { ActionButton, AppCard, SectionTitle } from '../components/ui';

const THEME_OPTIONS: ThemeMode[] = ['system', 'light', 'dark'];

export function SettingsScreen(): React.JSX.Element {
  const settings = useAppStore(state => state.settings);
  const toggleBuiltInHabitVisibility = useAppStore(
    state => state.toggleBuiltInHabitVisibility,
  );
  const setDisciplineQuestionLabel = useAppStore(
    state => state.setDisciplineQuestionLabel,
  );
  const addCustomQuestion = useAppStore(state => state.addCustomQuestion);
  const renameCustomQuestion = useAppStore(state => state.renameCustomQuestion);
  const toggleCustomQuestion = useAppStore(state => state.toggleCustomQuestion);
  const deleteCustomQuestion = useAppStore(state => state.deleteCustomQuestion);
  const setThemeMode = useAppStore(state => state.setThemeMode);
  const exportData = useAppStore(state => state.exportData);
  const importData = useAppStore(state => state.importData);
  const resetAllData = useAppStore(state => state.resetAllData);

  const [newQuestionText, setNewQuestionText] = useState('');

  const systemColorScheme = useColorScheme();
  const palette = getPalette(settings.themeMode, systemColorScheme);

  const handleExport = async (): Promise<void> => {
    try {
      const path = await exportData();
      Alert.alert('Export complete', `Backup saved at:\n${path}`);
    } catch {
      Alert.alert('Export failed', 'Could not export data right now.');
    }
  };

  const handleImport = async (): Promise<void> => {
    try {
      await importData();
      Alert.alert('Import complete', 'Backup restored successfully.');
    } catch (error) {
      if (!isImportCancelled(error)) {
        Alert.alert('Import failed', 'Invalid file or unsupported backup format.');
      }
    }
  };

  const handleReset = (): void => {
    Alert.alert(
      'Reset all local data?',
      'This permanently clears logs, photos references, and settings. Export backup first if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('Done', 'All data reset to a clean state.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.contentContainer}>
      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Theme" />
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map(mode => (
            <ActionButton
              key={mode}
              palette={palette}
              label={mode.toUpperCase()}
              variant={settings.themeMode === mode ? 'primary' : 'secondary'}
              onPress={() => setThemeMode(mode)}
            />
          ))}
        </View>
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Built-in Daily Questions" />
        {(Object.keys(settings.builtInHabitVisibility) as Array<
          keyof typeof settings.builtInHabitVisibility
        >).map(key => (
          <View key={key} style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: palette.text }]}>
              {BUILT_IN_HABIT_LABELS[key]}
            </Text>
            <Switch
              value={settings.builtInHabitVisibility[key]}
              onValueChange={value => toggleBuiltInHabitVisibility(key, value)}
            />
          </View>
        ))}

        <Text style={[styles.rowLabel, { color: palette.text }]}>Discipline question text</Text>
        <TextInput
          value={settings.disciplineQuestionLabel}
          onChangeText={setDisciplineQuestionLabel}
          placeholder="Customize label"
          placeholderTextColor={palette.mutedText}
          style={[
            styles.textInput,
            {
              borderColor: palette.border,
              color: palette.text,
              backgroundColor: palette.background,
            },
          ]}
        />
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Custom Questions" />
        <View style={styles.addQuestionRow}>
          <TextInput
            value={newQuestionText}
            onChangeText={setNewQuestionText}
            placeholder="Add yes/no question"
            placeholderTextColor={palette.mutedText}
            style={[
              styles.textInput,
              styles.flexInput,
              {
                borderColor: palette.border,
                color: palette.text,
                backgroundColor: palette.background,
              },
            ]}
          />
          <ActionButton
            palette={palette}
            label="Add"
            onPress={() => {
              addCustomQuestion(newQuestionText);
              setNewQuestionText('');
            }}
          />
        </View>

        {settings.customQuestions.length === 0 ? (
          <Text style={{ color: palette.mutedText }}>
            No custom questions yet.
          </Text>
        ) : (
          settings.customQuestions.map(question => (
            <View
              key={question.id}
              style={[styles.customQuestionCard, { borderColor: palette.border }]}
            >
              <TextInput
                value={question.label}
                onChangeText={value => renameCustomQuestion(question.id, value)}
                placeholder="Question label"
                placeholderTextColor={palette.mutedText}
                style={[
                  styles.textInput,
                  {
                    borderColor: palette.border,
                    color: palette.text,
                    backgroundColor: palette.background,
                  },
                ]}
              />
              <View style={styles.switchRow}>
                <Text style={[styles.rowLabel, { color: palette.text }]}>Visible daily</Text>
                <Switch
                  value={question.enabled}
                  onValueChange={value => toggleCustomQuestion(question.id, value)}
                />
              </View>
              <ActionButton
                palette={palette}
                label="Delete"
                variant="danger"
                onPress={() => deleteCustomQuestion(question.id)}
              />
            </View>
          ))
        )}
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Data Management" />
        <View style={styles.dataActionRow}>
          <ActionButton palette={palette} label="Export JSON" onPress={handleExport} />
          <ActionButton
            palette={palette}
            label="Import JSON"
            variant="secondary"
            onPress={handleImport}
          />
        </View>
        <ActionButton
          palette={palette}
          label="Reset All Data"
          variant="danger"
          onPress={handleReset}
        />
        <Text style={[styles.helpText, { color: palette.mutedText }]}>
          Everything stays local on this device. Use export/import for backups.
        </Text>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 36,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  addQuestionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  flexInput: {
    flex: 1,
  },
  customQuestionCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  dataActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  helpText: {
    fontSize: 12,
    marginTop: 10,
  },
});
