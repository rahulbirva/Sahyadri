import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/lib/theme';

export function ActionButton({
  label,
  onPress,
  variant = 'dark',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'dark' | 'outline';
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'outline' ? styles.outline : styles.dark,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderRadius: 0 },
  dark: { backgroundColor: colors.nearBlack, borderColor: colors.nearBlack },
  outline: { backgroundColor: colors.paper, borderColor: colors.ink },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  text: { color: colors.paper, fontFamily: fonts.sansBold, fontSize: 14, letterSpacing: 0.2 },
  outlineText: { color: colors.ink },
});
