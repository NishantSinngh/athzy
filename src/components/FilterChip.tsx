import React, { useEffect } from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { theme, type Accent } from '../theme';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Section accent. Selection tints with this instead of brand green. */
  accent: Accent;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Trailing count, e.g. how many results the filter yields. */
  count?: number;
  style?: ViewStyle;
}

/**
 * The one filter chip for the whole app.
 *
 * Selected state is a tinted wash plus a coloured border, not a solid fill —
 * solid fills at chip size are what made whole rows read as blocks of colour.
 * The tint animates, so switching filters has continuity instead of a flash.
 */
export function FilterChip({ label, active, onPress, accent, icon, count, style }: FilterChipProps) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, theme.motion.spring.gentle);
  }, [active, progress]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.colors.surface, accent.muted]),
    borderColor: interpolateColor(progress.value, [0, 1], [theme.colors.border, accent.soft]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.02]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [theme.colors.textSecondary, accent.base]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
    >
      <Animated.View style={[styles.chip, containerStyle, style]}>
        {icon ? (
          <Ionicons name={icon} size={14} color={active ? accent.base : theme.colors.textMuted} />
        ) : null}

        <Animated.Text style={[styles.label, active && styles.labelActive, labelStyle]} numberOfLines={1}>
          {label}
        </Animated.Text>

        {count !== undefined && count > 0 ? (
          <Animated.Text style={[styles.count, labelStyle]}>{count}</Animated.Text>
        ) : null}
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 15,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
  },
  label: { ...theme.typography.caption, fontSize: 13, fontFamily: theme.font.medium },
  labelActive: { fontFamily: theme.font.bold },
  count: { ...theme.typography.caption, fontSize: 12, fontFamily: theme.font.bold, opacity: 0.75 },
});
