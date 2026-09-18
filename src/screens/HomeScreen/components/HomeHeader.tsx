import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '../../../components/PressableScale';
import { Avatar } from '../../../components/Avatar';
import { AnimatedIcon } from '../../../components/AnimatedIcon';
import { Skeleton } from '../../../components/Skeleton';
import { theme } from '../../../theme';
import { styles } from '../styles';

export const AmbientGlow = React.memo(() => {
  const breath = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    opacity: 0.5 + breath.value * 0.5,
    transform: [
      { translateY: breath.value * 12 },
      { scale: 1 + breath.value * 0.06 },
    ],
  }));

  return (
    <Animated.View style={[styles.glow, style]} pointerEvents="none">
      <LinearGradient
        colors={theme.gradients.brandFade}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
});

export const Header = React.memo(
  ({
    greeting,
    name,
    avatarUrl,
    location,
    unreadCount,
    loading,
    onProfile,
    onNotifications,
    onLocation,
  }: any) => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <PressableScale
          style={styles.identity}
          onPress={onProfile}
          haptic="selection"
          accessibilityRole="button"
        >
          <Avatar uri={avatarUrl} name={name} size={46} ring />
          <View style={styles.identityCopy}>
            <Text style={styles.greeting} numberOfLines={1}>
              {greeting}
            </Text>
            {loading && !name ? (
              <Skeleton
                width={120}
                height={18}
                radius={theme.borderRadius.xs}
                style={{ marginTop: 4 }}
              />
            ) : (
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
            )}
          </View>
        </PressableScale>

        <View style={styles.headerActions}>
          <PressableScale
            style={styles.locationChip}
            onPress={onLocation}
            haptic="selection"
            accessibilityRole="button"
          >
            <Ionicons
              name="location"
              size={13}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={theme.colors.textMuted}
            />
          </PressableScale>

          <PressableScale
            style={styles.iconButton}
            onPress={onNotifications}
            accessibilityRole="button"
          >
            <AnimatedIcon
              name="bell"
              active={unreadCount > 0}
              size={21}
              color={theme.colors.textSecondary}
              activeColor={theme.colors.text}
            />
            {unreadCount > 0 ? (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeDotText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </PressableScale>
        </View>
      </View>
    </View>
  ),
);

export const SearchEntry = React.memo(
  ({ onPress }: { onPress: () => void }) => (
    <View style={styles.searchRow}>
      <PressableScale
        style={styles.search}
        scaleTo={0.985}
        onPress={onPress}
        accessibilityRole="search"
      >
        <Ionicons name="search" size={19} color={theme.colors.textMuted} />
        <Text style={styles.searchPlaceholder}>
          Search events, venues, tournaments
        </Text>
        <View style={styles.searchHint}>
          <Ionicons
            name="options-outline"
            size={16}
            color={theme.colors.textSecondary}
          />
        </View>
      </PressableScale>
    </View>
  ),
);
