import React, { useCallback } from 'react';
import { Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { theme } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Feedback = 'light' | 'medium' | 'heavy' | 'selection' | 'none';

const impactStyles = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

export function triggerHaptic(feedback: Feedback = 'light') {
  if (feedback === 'none' || Platform.OS === 'web') return;
  if (feedback === 'selection') Haptics.selectionAsync().catch(() => undefined);
  else Haptics.impactAsync(impactStyles[feedback]).catch(() => undefined);
}

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far the element shrinks while held. Larger surfaces want less travel. */
  scaleTo?: number;
  /** Dim alongside the scale. Off by default so imagery keeps its contrast. */
  dim?: boolean;
  /** Haptic fired on press-in. Pass 'none' inside scroll-heavy lists. */
  haptic?: Feedback;
}

/**
 * The app's standard touchable: springs down on press instead of the flat
 * opacity blink `TouchableOpacity` gives, and fires a haptic on the way in so
 * the tap registers before the navigation transition starts.
 */
export function PressableScale({
  children,
  style,
  scaleTo = theme.motion.pressScale,
  dim = false,
  haptic = 'light',
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * (1 - scaleTo), theme.motion.spring.press) }],
    opacity: dim ? withTiming(1 - pressed.value * 0.15, { duration: theme.motion.duration.instant }) : 1,
  }));

  const handlePressIn = useCallback(
    (event: any) => {
      pressed.value = 1;
      if (!disabled) triggerHaptic(haptic);
      onPressIn?.(event);
    },
    [disabled, haptic, onPressIn, pressed],
  );

  const handlePressOut = useCallback(
    (event: any) => {
      pressed.value = 0;
      onPressOut?.(event);
    },
    [onPressOut, pressed],
  );

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      // onPressIn={handlePressIn}
      // onPressOut={handlePressOut}
      disabled={disabled}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
