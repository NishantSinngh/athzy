import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { AppImage } from '../../../components/AppImage';
import { PressableScale } from '../../../components/PressableScale';
import { Badge } from '../../../components/Badge';
import { theme } from '../../../theme';
import {
  formatCountdown,
  formatDayBadge,
  isListingLive,
} from '../../../utils/format';
import { styles, HERO_GAP } from '../styles';

export const HeroCarousel = React.memo(({ items, navigation }: any) => {
  const { width } = useWindowDimensions();
  const cardWidth = width - theme.spacing.gutter * 2;
  const stride = cardWidth + HERO_GAP;
  const [index, setIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const currentIndex = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
      const next = Math.round(event.contentOffset.x / stride);
      if (next !== currentIndex.value) {
        currentIndex.value = next;
        runOnJS(setIndex)(next);
      }
    },
  });

  const openListing = useCallback(
    (item: any) => {
      if (item.tournament)
        navigation.navigate('TournamentDetails', { tournamentId: item.id });
      else navigation.navigate('EventDetails', { eventId: item.id });
    },
    [navigation],
  );

  return (
    <View style={styles.heroBlock}>
      <Animated.FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={stride}
        snapToAlignment="start"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.heroList}
        renderItem={({ item, index: cardIndex }: any) => (
          <HeroCard
            item={item}
            width={cardWidth}
            index={cardIndex}
            stride={stride}
            scrollX={scrollX}
            onPress={openListing}
          />
        )}
      />
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((item: any, dotIndex: number) => (
            <Dot
              key={item.id}
              index={dotIndex}
              stride={stride}
              scrollX={scrollX}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
});

const Dot = React.memo(({ index, stride, scrollX }: any) => {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value / stride - index);
    const closeness = Math.max(0, 1 - distance);
    return {
      width: 6 + closeness * 14,
      opacity: 0.3 + closeness * 0.7,
      backgroundColor: interpolateColor(
        closeness,
        [0, 1],
        [theme.colors.textMuted, theme.colors.text],
      ),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
});

const HeroCard = React.memo(
  ({ item, width, index, stride, scrollX, onPress }: any) => {
    const live = isListingLive(item);
    const countdown = formatCountdown(item.startsAt);
    const attending = item._count?.registrations ?? 0;

    const depth = useAnimatedStyle(() => {
      const distance = Math.abs(scrollX.value / stride - index);
      const closeness = Math.max(0, 1 - Math.min(distance, 1));
      return {
        transform: [{ scale: 0.94 + closeness * 0.06 }],
        opacity: 0.65 + closeness * 0.35,
      };
    });

    return (
      <Animated.View style={depth}>
        <PressableScale
          style={[styles.hero, { width }]}
          scaleTo={0.98}
          onPress={() => onPress(item)}
        >
          <AppImage
            uri={item.imageUrl}
            fallback={item.tournament ? 'tournament' : 'event'}
            style={styles.heroImage}
            priority="high"
          />
          <LinearGradient
            colors={theme.gradients.imageScrim}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroTopRow}>
            {live ? <Badge label="Live now" tone="live" /> : null}
            {!live && countdown ? (
              <Badge
                label={countdown}
                tone="primary"
                icon="time-outline"
                caps={false}
              />
            ) : null}
            {item.tournament ? (
              <Badge label="Tournament" tone="neutral" />
            ) : null}
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroSport}>
              {item.sport?.name?.toUpperCase() || 'ATHZY EVENT'}
            </Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.heroMeta}>
              <Ionicons
                name="location"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.heroMetaText} numberOfLines={1}>
                {item.venue?.name || 'Venue to be announced'}
              </Text>
            </View>
            <View style={styles.heroFooter}>
              {attending > 0 ? (
                <View style={styles.heroAttending}>
                  <Ionicons
                    name="people"
                    size={15}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.heroAttendingText}>
                    {attending} going
                  </Text>
                </View>
              ) : (
                <Text style={styles.heroAttendingText}>
                  Be the first to join
                </Text>
              )}
              <View style={styles.heroCta}>
                <Text style={styles.heroCtaText}>
                  {item.tournament ? 'View' : 'Join'}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={theme.colors.onPrimary}
                />
              </View>
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    );
  },
);
