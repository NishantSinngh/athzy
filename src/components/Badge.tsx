import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

export type BadgeTone = 'primary' | 'neutral' | 'outline' | 'warning' | 'error' | 'info' | 'live';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Uppercase + letterspaced, for eyebrow-style tags. */
  caps?: boolean;
  style?: StyleProp<ViewStyle>;
}

const tones: Record<BadgeTone, { background: string; color: string; border?: string }> = {
  primary: { background: theme.colors.primary, color: theme.colors.onPrimary },
  neutral: { background: theme.colors.surfaceLight, color: theme.colors.textSecondary },
  outline: { background: 'transparent', color: theme.colors.textSecondary, border: theme.colors.border },
  warning: { background: theme.colors.warningMuted, color: theme.colors.warning },
  error: { background: theme.colors.errorMuted, color: theme.colors.error },
  info: { background: theme.colors.infoMuted, color: theme.colors.info },
  live: { background: theme.colors.errorMuted, color: theme.colors.error, border: 'rgba(240,68,68,0.35)' },
};

/**
 * The pill that was hand-rolled in six screens with six different paddings.
 * `live` additionally shows a pulsing dot for in-progress events.
 */
export function Badge({ label, tone = 'primary', icon, caps = true, style }: BadgeProps) {
  const palette = tones[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.background },
        palette.border ? { borderWidth: 1, borderColor: palette.border } : null,
        style,
      ]}
    >
      {tone === 'live' ? <LiveDot /> : null}
      {icon ? <Ionicons name={icon} size={12} color={palette.color} style={styles.icon} /> : null}
      <Text style={[styles.text, { color: palette.color }, caps && styles.caps]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Heartbeat for in-progress events: a quick double-beat, then a rest. A steady
 * sine pulse reads as a loading spinner; this reads as "something is live".
 */
function LiveDot() {
  const beat = useSharedValue(0);

  useEffect(() => {
    beat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }),
        withTiming(0.35, { duration: 200 }),
        withTiming(0.9, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 260 }),
        withTiming(0, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [beat]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + beat.value * 0.35 }],
    opacity: 0.55 + beat.value * 0.45,
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: beat.value * 0.5,
    transform: [{ scale: 1 + beat.value * 1.6 }],
  }));

  return (
    <View style={styles.liveWrap}>
      <Animated.View style={[styles.liveHalo, haloStyle]} pointerEvents="none" />
      <Animated.View style={[styles.liveDot, dotStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.s,
  },
  text: { ...theme.typography.badge },
  caps: { textTransform: 'uppercase' },
  icon: { marginRight: 5 },
  liveWrap: { width: 6, height: 6, marginRight: 6, alignItems: 'center', justifyContent: 'center' },
  liveHalo: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.error,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.error },
});
