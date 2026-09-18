import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptic } from './PressableScale';
import { theme } from '../theme';

interface SuccessHeroProps {
  title: string;
  /** Rendered under the title; pass rich text to emphasise the subject. */
  message?: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Confirmation mark for the end of a booking flow: the ring expands, the badge
 * springs in, and a success haptic fires — the moment should feel earned.
 */
export function SuccessHero({ title, message, icon = 'checkmark' }: SuccessHeroProps) {
  const badge = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    triggerHaptic('medium');
    badge.value = withSequence(withSpring(1.12, theme.motion.spring.bouncy), withSpring(1, theme.motion.spring.gentle));
    ring.value = withDelay(120, withTiming(1, { duration: theme.motion.duration.slow }));
  }, [badge, ring]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badge.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value * 0.9,
    transform: [{ scale: 0.75 + ring.value * 0.25 }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.ringWrap}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.badge, badgeStyle]}>
          <Ionicons name={icon} size={34} color={theme.colors.onPrimary} />
        </Animated.View>
      </View>

      <Animated.Text
        entering={FadeInDown.delay(140).duration(theme.motion.duration.normal)}
        style={styles.title}
        accessibilityRole="header"
      >
        {title}
      </Animated.Text>

      {message ? (
        <Animated.View entering={FadeInDown.delay(220).duration(theme.motion.duration.normal)}>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: theme.spacing.s },
  ringWrap: { width: 136, height: 136, alignItems: 'center', justifyContent: 'center' },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 68,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
    backgroundColor: theme.colors.primaryMuted,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    ...theme.elevation.glow,
  },
  title: { ...theme.typography.display, fontSize: 29, marginTop: theme.spacing.m, textAlign: 'center' },
  message: {
    ...theme.typography.bodyLarge,
    fontSize: 15,
    textAlign: 'center',
    marginTop: theme.spacing.s,
    maxWidth: 330,
  },
});

export const successStyles = StyleSheet.create({
  bold: { color: theme.colors.text, fontFamily: theme.font.bold },
});
