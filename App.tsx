import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppStore } from './src/state/useAppStore';

function App(): React.JSX.Element {
  const systemColorScheme = useColorScheme();
  const init = useAppStore(state => state.init);
  const themeMode = useAppStore(state => state.settings.themeMode);

  useEffect(() => {
    init().catch(error => {
      console.warn('Failed to initialize app state', error);
    });
  }, [init]);

  const isDarkMode =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
