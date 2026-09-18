import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { theme } from '../theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Softer treatment for empty sections inside a scrolling page. */
  compact?: boolean;
  /** Red icon wash — for failures rather than genuinely empty content. */
  tone?: 'neutral' | 'error';
  style?: StyleProp<ViewStyle>;
}

/**
 * One empty/error state for the whole app. Previously each screen wrote its own,
 * so "nothing here yet" looked different in eight places.
 */
export function EmptyState({
  icon = 'sparkles-outline',
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
  tone = 'neutral',
  style,
}: EmptyStateProps) {
  const isError = tone === 'error';

  const drift = useSharedValue(0);

  useEffect(() => {
    // An error state should feel still; only genuinely-empty states drift.
    if (isError) return;
    drift.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift, isError]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -drift.value * 5 }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + drift.value * 0.35,
    transform: [{ scale: 1 + drift.value * 0.18 }],
  }));

  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <Animated.View style={iconStyle}>
        <Animated.View
          style={[styles.halo, isError && styles.haloError, haloStyle]}
          pointerEvents="none"
        />
        <View style={[styles.iconWrap, isError && styles.iconWrapError]}>
          <Ionicons name={icon} size={compact ? 24 : 30} color={isError ? theme.colors.error : theme.colors.primary} />
        </View>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(60).duration(theme.motion.duration.normal)}
        style={styles.title}
        accessibilityRole="header"
      >
        {title}
      </Animated.Text>

      {message ? (
        <Animated.Text entering={FadeInDown.delay(120).duration(theme.motion.duration.normal)} style={styles.message}>
          {message}
        </Animated.Text>
      ) : null}

      {actionLabel && onAction ? (
        <Animated.View entering={FadeInDown.delay(180).duration(theme.motion.duration.normal)}>
          <PressableScale style={styles.action} onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </PressableScale>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: theme.spacing.l,
  },
  compact: {
    paddingVertical: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryMuted,
  },
  iconWrapError: { backgroundColor: theme.colors.errorMuted },
  halo: {
    position: 'absolute',
    top: -9,
    left: -9,
    right: -9,
    bottom: -9,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: theme.colors.primaryMuted,
  },
  haloError: { backgroundColor: theme.colors.errorMuted },
  title: { ...theme.typography.title, marginTop: theme.spacing.m, textAlign: 'center' },
  message: {
    ...theme.typography.bodySmall,
    textAlign: 'center',
    marginTop: theme.spacing.s,
    maxWidth: 300,
  },
  action: {
    minHeight: theme.hitTarget,
    justifyContent: 'center',
    marginTop: theme.spacing.l,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionText: { ...theme.typography.caption, color: theme.colors.primary, fontFamily: theme.font.bold },
});
