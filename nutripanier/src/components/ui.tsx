import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, MinTouch, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Screen({ children, testID }: { children: ReactNode; testID?: string }) {
  const c = useTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        testID={testID}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const c = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>
      {children}
    </Text>
  );
}

export function Body({
  children,
  tone = 'normal',
  testID,
}: {
  children: ReactNode;
  tone?: 'normal' | 'muted' | 'danger' | 'warning';
  testID?: string;
}) {
  const c = useTheme();
  const color = { normal: c.text, muted: c.textSecondary, danger: c.danger, warning: c.warning }[
    tone
  ];
  return (
    <Text testID={testID} style={[styles.body, { color }]}>
      {children}
    </Text>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const c = useTheme();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>{children}</View>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.textSecondary}
        style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
        {...props}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  testID,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const c = useTheme();
  const background = variant === 'primary' ? c.primary : 'transparent';
  const color = variant === 'primary' ? c.onPrimary : variant === 'danger' ? c.danger : c.primary;
  const borderColor = variant === 'danger' ? c.danger : c.primary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}>
      {loading ? <ActivityIndicator color={color} /> : <Text style={[styles.buttonText, { color }]}>{title}</Text>}
    </Pressable>
  );
}

export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useTheme();
  return (
    <View style={styles.field} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={o.label}
              onPress={() => onChange(o.value)}
              style={[
                styles.choice,
                { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primary : 'transparent' },
              ]}>
              <Text style={{ color: selected ? c.onPrimary : c.text }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.five * 2,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: { fontSize: 28, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22 },
  card: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  field: { gap: Spacing.one },
  label: { fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 10, minHeight: MinTouch, paddingHorizontal: Spacing.three, fontSize: 16 },
  button: {
    minHeight: MinTouch,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  choice: { minHeight: MinTouch, borderWidth: 1, borderRadius: 24, paddingHorizontal: Spacing.three, justifyContent: 'center' },
});
