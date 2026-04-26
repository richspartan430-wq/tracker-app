import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Palette } from '../utils/theme';
import { YesNoValue } from '../types/domain';

interface CardProps {
  palette: Palette;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function AppCard({ palette, children, style }: CardProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

interface SectionTitleProps {
  palette: Palette;
  title: string;
}

export function SectionTitle({ palette, title }: SectionTitleProps): React.JSX.Element {
  return <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>;
}

interface YesNoToggleProps {
  palette: Palette;
  value: YesNoValue;
  onChange: (value: YesNoValue) => void;
}

export function YesNoToggle({
  palette,
  value,
  onChange,
}: YesNoToggleProps): React.JSX.Element {
  return (
    <View style={styles.toggleContainer}>
      <Pressable
        accessibilityRole="button"
        style={[
          styles.toggleButton,
          {
            borderColor: palette.border,
            backgroundColor: value === 'yes' ? palette.success : 'transparent',
          },
        ]}
        onPress={() => onChange(value === 'yes' ? null : 'yes')}>
        <Text style={[styles.toggleText, { color: palette.text }]}>Yes</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={[
          styles.toggleButton,
          {
            borderColor: palette.border,
            backgroundColor: value === 'no' ? palette.danger : 'transparent',
          },
        ]}
        onPress={() => onChange(value === 'no' ? null : 'no')}>
        <Text style={[styles.toggleText, { color: palette.text }]}>No</Text>
      </Pressable>
    </View>
  );
}

interface NumberInputProps {
  palette: Palette;
  value?: number;
  placeholder?: string;
  onChange: (value?: number) => void;
}

export function NumberInputField({
  palette,
  value,
  placeholder,
  onChange,
}: NumberInputProps): React.JSX.Element {
  return (
    <TextInput
      keyboardType="number-pad"
      placeholder={placeholder}
      placeholderTextColor={palette.mutedText}
      value={value === undefined ? '' : String(value)}
      onChangeText={text => {
        if (!text.trim()) {
          onChange(undefined);
          return;
        }

        const parsed = Number(text);
        onChange(Number.isNaN(parsed) ? undefined : parsed);
      }}
      style={[
        styles.textInput,
        {
          color: palette.text,
          borderColor: palette.border,
          backgroundColor: palette.background,
        },
      ]}
    />
  );
}

interface ActionButtonProps {
  palette: Palette;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function ActionButton({
  palette,
  label,
  onPress,
  variant = 'primary',
}: ActionButtonProps): React.JSX.Element {
  const backgroundColor =
    variant === 'primary'
      ? palette.primary
      : variant === 'danger'
        ? palette.danger
        : palette.border;

  const textColor = variant === 'secondary' ? palette.text : '#FFFFFF';

  return (
    <Pressable
      style={[styles.actionButton, { backgroundColor }]}
      onPress={onPress}
      accessibilityRole="button">
      <Text style={[styles.actionButtonText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontWeight: '700',
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
