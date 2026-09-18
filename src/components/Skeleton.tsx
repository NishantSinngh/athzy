import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A single pulsing placeholder block. Prefer building a skeleton that mirrors
 * the real layout over dropping a spinner in the middle of the screen — the
 * content then fades in without the page jumping.
 */
export function Skeleton({ width = '100%', height = 16, radius = theme.borderRadius.s, style }: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.45,
  }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.colors.surfaceLight }, animatedStyle, style]}
    />
  );
}

/** Stacked text lines, with the last one short so it reads as a paragraph. */
export function SkeletonText({ lines = 2, lastLineWidth = '60%' as `${number}%`, gap = 8 }) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={12}
          radius={theme.borderRadius.xs}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </View>
  );
}

/** Placeholder matching the shape of a horizontal discover/event card. */
export function SkeletonCard({ width = 260, imageHeight = 140 }: { width?: number; imageHeight?: number }) {
  return (
    <View style={[styles.card, { width }]}>
      <Skeleton height={imageHeight} radius={theme.borderRadius.l} />
      <View style={styles.cardBody}>
        <Skeleton height={14} width="80%" radius={theme.borderRadius.xs} />
        <Skeleton height={12} width="55%" radius={theme.borderRadius.xs} />
      </View>
    </View>
  );
}

/** Placeholder matching an avatar + two-line row (chat inbox, notifications). */
export function SkeletonRow({ avatarSize = 52 }: { avatarSize?: number }) {
  return (
    <View style={styles.row}>
      <Skeleton width={avatarSize} height={avatarSize} radius={theme.borderRadius.l} />
      <View style={styles.rowBody}>
        <Skeleton height={13} width="65%" radius={theme.borderRadius.xs} />
        <Skeleton height={11} width="40%" radius={theme.borderRadius.xs} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  cardBody: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBody: { flex: 1, gap: 9 },
});
