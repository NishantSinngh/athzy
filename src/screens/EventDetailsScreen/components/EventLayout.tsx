import React from 'react';
import { View, Text, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { PressableScale } from '../../../components/PressableScale';
import { Button } from '../../../components/Button';
import { Skeleton } from '../../../components/Skeleton';
import { theme } from '../../../theme';
import { formatDayBadge, formatTime } from '../../../utils/format';
import { styles, HERO_HEIGHT } from '../styles';

export const TopBar = React.memo(({ event, scrollY, onBack, insets }: any) => {
  const topBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [HERO_HEIGHT - 180, HERO_HEIGHT - 90],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const shareEvent = () => {
    Share.share({
      title: event.title,
      message: `${event.title}\n${formatDayBadge(
        event.startsAt,
      )} · ${formatTime(event.startsAt, event.venue?.timeZone)}\n${
        event.venue?.name || 'Venue TBA'
      }\n\nJoin me on Athzy.`,
    }).catch(() => undefined);
  };

  return (
    <View
      style={[styles.topBar, { paddingTop: insets.top + theme.spacing.s }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[styles.topBarBackdrop, topBarStyle]}
        pointerEvents="none"
      />
      <PressableScale
        style={styles.circleButton}
        scaleTo={0.9}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
      </PressableScale>
      <PressableScale
        style={styles.circleButton}
        scaleTo={0.9}
        onPress={shareEvent}
        haptic="selection"
        accessibilityRole="button"
        accessibilityLabel="Share event"
      >
        <Ionicons name="share-outline" size={21} color={theme.colors.text} />
      </PressableScale>
    </View>
  );
});

export const BottomBar = React.memo(
  ({
    event,
    registered,
    started,
    full,
    joinDisabled,
    totalFee,
    isTeamEntry,
    onBook,
    insets,
  }: any) => (
    <View
      style={[
        styles.bottomBar,
        { paddingBottom: Math.max(insets.bottom, theme.spacing.m) },
      ]}
    >
      <View style={styles.priceBlock}>
        <Text style={styles.priceLabel}>
          {event.registrationFeeMinor ? 'TOTAL' : 'ENTRY'}
        </Text>
        <Text style={styles.priceValue}>{totalFee}</Text>
      </View>
      <Button
        title={
          registered
            ? 'View my ticket'
            : started
            ? 'Booking closed'
            : full
            ? 'Sold out'
            : isTeamEntry
            ? 'Enter a team'
            : 'Book tickets'
        }
        trailingIconName={
          registered || !joinDisabled ? 'arrow-forward' : undefined
        }
        onPress={onBook}
        disabled={joinDisabled && !registered}
        style={styles.joinButton}
      />
    </View>
  ),
);

export const DetailSkeleton = React.memo(({ insets }: any) => (
  <View style={styles.container}>
    <Skeleton height={HERO_HEIGHT} radius={0} />
    <View style={[styles.body, { paddingTop: theme.spacing.l }]}>
      <View style={styles.stats}>
        {[0, 1, 2].map(key => (
          <Skeleton
            key={key}
            height={72}
            radius={theme.borderRadius.l}
            style={{ flex: 1 }}
          />
        ))}
      </View>
      <View style={{ height: theme.spacing.xl }} />
      <Skeleton height={20} width="45%" radius={theme.borderRadius.xs} />
      <View style={{ height: theme.spacing.m }} />
      <Skeleton height={120} radius={theme.borderRadius.xl} />
    </View>
    <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.s }]}>
      <Skeleton width={44} height={44} radius={22} />
    </View>
  </View>
));
