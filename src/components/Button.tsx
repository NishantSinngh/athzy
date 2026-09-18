import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { theme } from '../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'large' | 'medium' | 'small';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  /** Ionicon rendered before the label. */
  iconName?: keyof typeof Ionicons.glyphMap;
  /** Ionicon rendered after the label — use for forward/continue actions. */
  trailingIconName?: keyof typeof Ionicons.glyphMap;
  /** Legacy escape hatch for a fully custom leading node. */
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

const heights: Record<Size, number> = { large: 56, medium: 48, small: 40 };
const fontSizes: Record<Size, number> = { large: 15, medium: 14, small: 13 };

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading,
  disabled,
  iconName,
  trailingIconName,
  icon,
  fullWidth,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) => {
  const inactive = disabled || loading;
  const palette = variants[variant];
  const contentColor = inactive && variant === 'primary' ? 'rgba(0,0,0,0.45)' : palette.color;

  return (
    <PressableScale
      style={[
        styles.base,
        { height: heights[size] },
        palette.container,
        fullWidth && styles.fullWidth,
        variant === 'primary' && !inactive && theme.elevation.glow,
        inactive && palette.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={inactive}
      scaleTo={0.975}
      haptic={variant === 'danger' ? 'medium' : 'light'}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          {iconName ? <Ionicons name={iconName} size={18} color={contentColor} /> : null}
          <Text style={[styles.text, { fontSize: fontSizes[size], color: contentColor }, textStyle]} numberOfLines={1}>
            {title}
          </Text>
          {trailingIconName ? <Ionicons name={trailingIconName} size={17} color={contentColor} /> : null}
        </View>
      )}
    </PressableScale>
  );
};

const variants: Record<Variant, { container: ViewStyle; color: string; disabled: ViewStyle }> = {
  primary: {
    container: { backgroundColor: theme.colors.primary },
    color: theme.colors.onPrimary,
    disabled: { backgroundColor: '#1E3A2E' },
  },
  secondary: {
    container: { backgroundColor: theme.colors.surfaceLight },
    color: theme.colors.text,
    disabled: { opacity: 0.5 },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.borderStrong },
    color: theme.colors.text,
    disabled: { opacity: 0.45 },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    color: theme.colors.primary,
    disabled: { opacity: 0.45 },
  },
  danger: {
    container: { backgroundColor: theme.colors.errorMuted, borderWidth: 1, borderColor: 'rgba(240,68,68,0.32)' },
    color: theme.colors.error,
    disabled: { opacity: 0.45 },
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.l,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  text: { fontFamily: theme.font.bold, letterSpacing: 0.2 },
});
