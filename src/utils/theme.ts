import { ColorSchemeName } from 'react-native';
import { ThemeMode } from '../types/domain';

export interface Palette {
  background: string;
  card: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  accent: string;
  danger: string;
  success: string;
}

const lightPalette: Palette = {
  background: '#F4F6F8',
  card: '#FFFFFF',
  text: '#14213D',
  mutedText: '#5C677D',
  border: '#DDE2E7',
  primary: '#0E7490',
  accent: '#FB8500',
  danger: '#B91C1C',
  success: '#15803D',
};

const darkPalette: Palette = {
  background: '#0D1B2A',
  card: '#1B263B',
  text: '#E0E1DD',
  mutedText: '#A9B4C2',
  border: '#2F3E55',
  primary: '#2DD4BF',
  accent: '#F59E0B',
  danger: '#F87171',
  success: '#4ADE80',
};

export function getPalette(
  themeMode: ThemeMode,
  systemColorScheme: ColorSchemeName,
): Palette {
  const shouldUseDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  return shouldUseDark ? darkPalette : lightPalette;
}
