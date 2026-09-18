import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme, type Accent } from '../theme';

interface RefreshBarProps {
  active: boolean;
  /** Section accent, so the bar matches the screen it sits on. */
  accent?: Accent;
}

/**
 * Indeterminate progress line pinned under the header while a refresh runs.
 *
 * `RefreshControl` stays in place for the gesture itself — it is the native,
 * accessible way to pull-to-refresh, and replacing it would mean hand-rolling
 * overscroll (Android reports no negative scroll offset, so a custom version
 * needs a pan handler competing with the scroll view). This adds the branded
 * feedback on top of it, and also covers refreshes the user did not trigger by
 * pulling — a focus refetch, or a retry from an error banner.
 */
export function RefreshBar({ active, accent }: RefreshBarProps) {
  const { width } = useWindowDimensions();
  const travel = useSharedValue(0);
  const fade = useSharedValue(0);
  const colors = accent ?? theme.accents.chat;

  useEffect(() => {
    if (active) {
      fade.value = withTiming(1, { duration: theme.motion.duration.fast });
      travel.value = 0;
      travel.value = withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }),
        -1,
        false,
      );
    } else {
      fade.value = withTiming(0, { duration: theme.motion.duration.normal });
    }
  }, [active, fade, travel]);

  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    // Sweeps a short segment across the full width, then wraps.
    transform: [{ translateX: -width * 0.4 + travel.value * width * 1.4 }],
  }));

  return (
    <Animated.View style={[styles.track, { width: width * 0.4 }, style]} pointerEvents="none">
      <LinearGradient
        colors={['transparent', colors.base, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    zIndex: 20,
  },
});
