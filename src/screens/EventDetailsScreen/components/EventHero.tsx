import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { AppImage } from '../../../components/AppImage';
import { Badge } from '../../../components/Badge';
import { HeroReveal } from '../../../components/HeroReveal';
import { theme } from '../../../theme';
import { formatDayBadge, formatTime } from '../../../utils/format';
import { styles, HERO_HEIGHT } from '../styles';

export const EventHero = React.memo(
  ({ event, scrollY, live, countdown }: any) => {
    const heroStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-HERO_HEIGHT, 0, HERO_HEIGHT],
            [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.35],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            scrollY.value,
            [-HERO_HEIGHT, 0],
            [2.2, 1],
            Extrapolation.CLAMP,
          ),
        },
      ],
    }));

    return (
      <View style={styles.heroWrap}>
        <Animated.View style={[styles.heroImageWrap, heroStyle]}>
          <HeroReveal style={styles.heroImage}>
            <AppImage
              uri={event.imageUrl}
              style={styles.heroImage}
              priority="high"
            />
          </HeroReveal>
        </Animated.View>
        <LinearGradient
          colors={theme.gradients.imageScrim}
          style={styles.heroScrim}
        />

        <View style={styles.heroBody}>
          <View style={styles.heroBadges}>
            {live ? <Badge label="Live now" tone="live" /> : null}
            {!live && countdown ? (
              <Badge label={countdown} tone="primary" caps={false} />
            ) : null}
            {event.eventType ? (
              <Badge
                label={String(event.eventType).replaceAll('_', ' ')}
                tone="neutral"
              />
            ) : null}
            {event.isPremium ? (
              <Badge label="Premium" tone="warning" icon="star" />
            ) : null}
          </View>

          <Text style={styles.heroTitle}>{event.title}</Text>

          <View style={styles.heroMeta}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.heroMetaText}>
              {formatDayBadge(event.startsAt, event.venue?.timeZone)} ·{' '}
              {formatTime(event.startsAt, event.venue?.timeZone)}
            </Text>
          </View>
          <View style={styles.heroMeta}>
            <Ionicons
              name="location-outline"
              size={15}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.heroMetaText} numberOfLines={1}>
              {[event.venue?.name, event.venue?.city]
                .filter(Boolean)
                .join(', ') || 'Venue to be announced'}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);
