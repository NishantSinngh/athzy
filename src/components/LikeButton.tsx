import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { theme } from '../theme';

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onPress: () => void;
  size?: number;
}

/**
 * Heart with a pop on activation. The count and fill come from optimistic local
 * state, so the tap reads as instant even while the request is in flight.
 */
export function LikeButton({ liked, count, onPress, size = 19 }: LikeButtonProps) {
  const pop = useSharedValue(0);
  const wasLiked = React.useRef(liked);

  useEffect(() => {
    if (liked && !wasLiked.current) {
      pop.value = withSequence(withSpring(1, theme.motion.spring.bouncy), withSpring(0, theme.motion.spring.bouncy));
    }
    wasLiked.current = liked;
  }, [liked, pop]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pop.value * 0.35 }],
  }));

  return (
    <PressableScale
      style={styles.button}
      onPress={onPress}
      scaleTo={0.88}
      haptic={liked ? 'selection' : 'medium'}
      accessibilityRole="button"
      accessibilityLabel={liked ? `Unlike, ${count} likes` : `Like, ${count} likes`}
      accessibilityState={{ selected: liked }}
      hitSlop={8}
    >
      <AnimatedIcon
        name={liked ? 'heart' : 'heart-outline'}
        size={size}
        color={liked ? theme.colors.error : theme.colors.textMuted}
        style={iconStyle}
      />
      <Text style={[styles.count, liked && styles.countLiked]}>{count}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  count: { ...theme.typography.caption, fontFamily: theme.font.semibold },
  countLiked: { color: theme.colors.error },
});
