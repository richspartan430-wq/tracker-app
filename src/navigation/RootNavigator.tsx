import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../state/useAppStore';
import { getPalette } from '../utils/theme';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { DailyLogScreen } from '../screens/DailyLogScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export function RootNavigator(): React.JSX.Element {
  const themeMode = useAppStore(state => state.settings.themeMode);
  const systemColorScheme = useColorScheme();
  const palette = getPalette(themeMode, systemColorScheme);
  const baseTheme = systemColorScheme === 'dark' ? DarkTheme : DefaultTheme;

  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: palette.background,
      card: palette.card,
      text: palette.text,
      border: palette.border,
      primary: palette.primary,
      notification: palette.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.text,
          tabBarStyle: {
            backgroundColor: palette.card,
            borderTopColor: palette.border,
          },
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.mutedText,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        }}>
        <Tab.Screen
          name="DailyLog"
          component={DailyLogScreen}
          options={{ title: '🏠 Daily Log', tabBarLabel: 'Daily' }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{ title: '📊 Analytics', tabBarLabel: 'Analytics' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: '⚙️ Settings & Data', tabBarLabel: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
