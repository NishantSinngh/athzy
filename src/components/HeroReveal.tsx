import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface HeroRevealProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Hold the reveal until the image and data are actually ready. */
  ready?: boolean;
}

/**
 * Detail-screen hero entrance.
 *
 * Reanimated 4 removed `sharedTransitionTag`, so a true shared-element morph
 * isn't available. This is the next best thing: the hero starts slightly
 * over-scaled and settles as the pushed screen arrives, which — paired with the
 * card's own press-scale on the way out — reads as one continuous expansion
 * rather than two unrelated screens.
 *
 * The settle is a decelerating tween, not a spring: a spring's overshoot fights
 * the platform push animation running underneath it.
 */
export function HeroReveal({ children, style, ready = true }: HeroRevealProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!ready) return;
    progress.value = withTiming(1, {
      duration: theme.motion.duration.slow,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, ready]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
    transform: [{ scale: 1.06 - progress.value * 0.06 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
