import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useAppStore } from '../state/useAppStore';
import { AnalyticsFilter } from '../types/domain';
import {
  formatMinutesToTimeLabel,
  formatReadableDate,
  fromDateKey,
  getDefaultDateRange,
  toDateKey,
} from '../utils/date';
import { getPalette } from '../utils/theme';
import { buildAnalytics, getRangeLabel } from '../services/metrics';
import { AppCard, SectionTitle } from '../components/ui';

const FILTER_OPTIONS: AnalyticsFilter[] = ['daily', 'weekly', 'monthly', 'custom'];

function round(value: number): string {
  return value.toFixed(1);
}

export function AnalyticsScreen(): React.JSX.Element {
  const selectedDate = useAppStore(state => state.selectedDate);
  const customRange = useAppStore(state => state.customRange);
  const setCustomRange = useAppStore(state => state.setCustomRange);
  const entries = useAppStore(state => state.entries);
  const settings = useAppStore(state => state.settings);

  const [activeFilter, setActiveFilter] = useState<AnalyticsFilter>('weekly');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const systemColorScheme = useColorScheme();
  const palette = getPalette(settings.themeMode, systemColorScheme);

  const range =
    activeFilter === 'custom'
      ? customRange
      : getDefaultDateRange(activeFilter, selectedDate);

  const analytics = useMemo(
    () => buildAnalytics(entries, settings, range),
    [entries, settings, range],
  );

  const chartWidth = Math.max(Dimensions.get('window').width - 44, 280);

  const labels = analytics.points.map(point => point.date.slice(5));
  const completionValues = analytics.points.map(point =>
    Number(point.completionRate.toFixed(1)),
  );
  const repsValues = analytics.points.map(point => point.totalReps);

  const totalCompleted = analytics.points.reduce(
    (sum, point) => sum + point.totalCompleted,
    0,
  );
  const totalExpected = analytics.points.reduce(
    (sum, point) => sum + point.totalExpected,
    0,
  );
  const missed = Math.max(totalExpected - totalCompleted, 0);

  const pieData = [
    {
      name: 'Completed',
      population: Math.max(totalCompleted, 0.0001),
      color: palette.success,
      legendFontColor: palette.text,
      legendFontSize: 12,
    },
    {
      name: 'Missed',
      population: Math.max(missed, 0.0001),
      color: palette.danger,
      legendFontColor: palette.text,
      legendFontSize: 12,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.contentContainer}>
      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Analytics" />
        <View style={styles.filtersRow}>
          {FILTER_OPTIONS.map(filterOption => (
            <Pressable
              key={filterOption}
              onPress={() => setActiveFilter(filterOption)}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    activeFilter === filterOption ? palette.primary : palette.border,
                },
              ]}>
              <Text
                style={{
                  color: activeFilter === filterOption ? '#FFFFFF' : palette.text,
                  fontWeight: '700',
                  fontSize: 12,
                }}>
                {filterOption.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: palette.mutedText, marginTop: 8 }}>
          {getRangeLabel(range)}
        </Text>

        {activeFilter === 'custom' && (
          <View style={styles.customRangeRow}>
            <Pressable
              style={[styles.dateButton, { borderColor: palette.border }]}
              onPress={() => setShowStartPicker(true)}>
              <Text style={{ color: palette.text }}>
                Start: {formatReadableDate(customRange.startDate)}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.dateButton, { borderColor: palette.border }]}
              onPress={() => setShowEndPicker(true)}>
              <Text style={{ color: palette.text }}>
                End: {formatReadableDate(customRange.endDate)}
              </Text>
            </Pressable>
          </View>
        )}
      </AppCard>

      <View style={styles.summaryGrid}>
        <AppCard palette={palette} style={styles.summaryCard}>
          <Text style={[styles.metricTitle, { color: palette.mutedText }]}>Completion</Text>
          <Text style={[styles.metricValue, { color: palette.text }]}>
            {round(analytics.summary.completionRate)}%
          </Text>
        </AppCard>

        <AppCard palette={palette} style={styles.summaryCard}>
          <Text style={[styles.metricTitle, { color: palette.mutedText }]}>Current Streak</Text>
          <Text style={[styles.metricValue, { color: palette.text }]}>🔥 {analytics.summary.currentStreak}</Text>
        </AppCard>

        <AppCard palette={palette} style={styles.summaryCard}>
          <Text style={[styles.metricTitle, { color: palette.mutedText }]}>Total Reps</Text>
          <Text style={[styles.metricValue, { color: palette.text }]}>
            {Math.round(analytics.summary.totalReps)}
          </Text>
        </AppCard>

        <AppCard palette={palette} style={styles.summaryCard}>
          <Text style={[styles.metricTitle, { color: palette.mutedText }]}>Exercise Consistency</Text>
          <Text style={[styles.metricValue, { color: palette.text }]}>
            {round(analytics.summary.exerciseConsistency)}%
          </Text>
        </AppCard>
      </View>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Habits Completion (Bar)" />
        <BarChart
          data={{
            labels,
            datasets: [{ data: completionValues.length ? completionValues : [0] }],
          }}
          width={chartWidth}
          height={220}
          fromZero
          yAxisLabel=""
          yAxisSuffix="%"
          chartConfig={{
            backgroundGradientFrom: palette.card,
            backgroundGradientTo: palette.card,
            color: () => palette.primary,
            labelColor: () => palette.text,
            decimalPlaces: 0,
            barPercentage: 0.7,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Progress Over Time (Line)" />
        <LineChart
          data={{
            labels,
            datasets: [{ data: repsValues.length ? repsValues : [0] }],
          }}
          width={chartWidth}
          height={220}
          chartConfig={{
            backgroundGradientFrom: palette.card,
            backgroundGradientTo: palette.card,
            color: () => palette.accent,
            labelColor: () => palette.text,
            decimalPlaces: 0,
          }}
          bezier
          style={styles.chart}
        />
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Habit Completion Split (Pie)" />
        <PieChart
          data={pieData}
          width={chartWidth}
          height={220}
          accessor="population"
          paddingLeft="16"
          backgroundColor="transparent"
          chartConfig={{
            backgroundGradientFrom: palette.card,
            backgroundGradientTo: palette.card,
            color: () => palette.text,
            labelColor: () => palette.text,
          }}
          absolute
        />
      </AppCard>

      <AppCard palette={palette}>
        <SectionTitle palette={palette} title="Sleep, Calories, Steps" />
        <Text style={[styles.detailText, { color: palette.text }]}>
          Avg sleep: {formatMinutesToTimeLabel(Math.round(analytics.summary.averageSleepMinutes || 0))}
        </Text>
        <Text style={[styles.detailText, { color: palette.text }]}>
          Avg planned calories: {round(analytics.summary.averagePlannedCalories)}
        </Text>
        <Text style={[styles.detailText, { color: palette.text }]}>
          Avg tracked calories: {round(analytics.summary.averageTrackedCalories)}
        </Text>
        <Text style={[styles.detailText, { color: palette.text }]}>
          Avg steps/day: {round(analytics.summary.averageSteps)}
        </Text>
      </AppCard>

      {showStartPicker && (
        <DateTimePicker
          mode="date"
          value={fromDateKey(customRange.startDate)}
          onChange={(_, selected) => {
            setShowStartPicker(false);
            if (selected) {
              setCustomRange(toDateKey(selected), customRange.endDate);
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          mode="date"
          value={fromDateKey(customRange.endDate)}
          onChange={(_, selected) => {
            setShowEndPicker(false);
            if (selected) {
              setCustomRange(customRange.startDate, toDateKey(selected));
            }
          }}
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
    paddingBottom: 36,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  customRangeRow: {
    marginTop: 10,
    gap: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryCard: {
    width: '48%',
    marginBottom: 0,
  },
  metricTitle: {
    fontSize: 12,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 8,
  },
});
