import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GridCard } from '../../../components/GridCard';
import { AppImage } from '../../../components/AppImage';
import { PressableScale } from '../../../components/PressableScale';
import { AvatarStack } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { Skeleton } from '../../../components/Skeleton';
import { theme } from '../../../theme';
import type { Tournament } from '../../../types/tournament';
import {
  formatCountdown,
  formatDateTime,
  formatMoney,
  isListingLive,
} from '../../../utils/format';
import { ACCENT, styles } from '../styles';

export const EventGridCard = React.memo(({ event, onPress }: any) => {
  const fee = event.registrationFeeMinor
    ? formatMoney(
        event.registrationFeeMinor + (event.serviceFeeMinor || 0),
        event.currency,
      )
    : 'Free';
  const live = isListingLive(event);
  const countdown = formatCountdown(event.startsAt);

  return (
    <GridCard
      accent={ACCENT}
      imageUrl={event.imageUrl}
      fallback="event"
      tag={event.sport?.name}
      status={live ? { label: 'Live now', tone: 'good' } : undefined}
      title={event.title}
      subtitle={
        countdown ?? formatDateTime(event.startsAt, event.venue?.timeZone)
      }
      place={
        [event.venue?.name, event.venue?.city].filter(Boolean).join(', ') ||
        'Venue TBA'
      }
      priceLabel={event.registrationFeeMinor ? 'ENTRY FEE' : undefined}
      price={fee}
      onPress={() => onPress(event.id)}
    />
  );
});

export const UpcomingGameRow = React.memo(
  ({
    tournament,
    onPress,
  }: {
    tournament: Tournament;
    onPress: (id: string) => void;
  }) => {
    const slotsLeft =
      tournament.maxEntries > 0
        ? tournament.maxEntries - tournament.entryCount
        : null;
    const status = tournament.isRegistrationOpen
      ? slotsLeft !== null && slotsLeft > 0 && slotsLeft <= 3
        ? { label: `${slotsLeft} left`, tone: 'warn' as const }
        : { label: 'Open', tone: 'open' as const }
      : tournament.status === 'IN_PROGRESS'
      ? { label: 'Live', tone: 'warn' as const }
      : {
          label: tournament.status.replaceAll('_', ' '),
          tone: 'muted' as const,
        };

    return (
      <PressableScale
        style={styles.gameRow}
        scaleTo={0.985}
        onPress={() => onPress(tournament.id)}
        accessibilityRole="button"
        accessibilityLabel={`${tournament.title}, ${status.label}`}
      >
        <AppImage
          uri={tournament.imageUrl}
          fallback="tournament"
          style={styles.gameThumb}
        />
        <View style={styles.gameCopy}>
          <Text style={styles.gameTitle} numberOfLines={1}>
            {tournament.title}
          </Text>
          <Text style={styles.gameSport}>
            {(
              tournament.sport?.name ?? tournament.format.replaceAll('_', ' ')
            ).toUpperCase()}
          </Text>
          <Text style={styles.gameWhen} numberOfLines={1}>
            {formatDateTime(
              tournament.startsAt,
              tournament.venue?.timeZone || undefined,
            )}
          </Text>
        </View>
        <View
          style={[
            styles.gamePill,
            status.tone === 'open' && styles.gamePillOpen,
            status.tone === 'warn' && styles.gamePillWarn,
          ]}
        >
          <Text
            style={[
              styles.gamePillText,
              status.tone === 'open' && styles.gamePillTextOpen,
              status.tone === 'warn' && styles.gamePillTextWarn,
            ]}
            numberOfLines={1}
          >
            {status.label}
          </Text>
        </View>
      </PressableScale>
    );
  },
);

export const FeaturedTournament = React.memo(
  ({
    tournament,
    onPress,
  }: {
    tournament: Tournament;
    onPress: (id: string) => void;
  }) => {
    const entrants = (tournament.entries ?? [])
      .map((entry: any) => entry.registrant)
      .filter(Boolean)
      .slice(0, 4);

    return (
      <PressableScale
        style={styles.featured}
        scaleTo={0.985}
        onPress={() => onPress(tournament.id)}
        accessibilityRole="button"
        accessibilityLabel={`Featured tournament: ${tournament.title}`}
      >
        <AppImage
          uri={tournament.imageUrl}
          fallback="tournament"
          style={styles.featuredImage}
          priority="high"
        />
        <LinearGradient
          colors={theme.gradients.imageScrim}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.featuredTop}>
          {tournament.isRegistrationOpen ? (
            <View style={styles.featuredFlag}>
              <Text style={styles.featuredFlagText}>LIVE REGISTRATION</Text>
            </View>
          ) : (
            <Badge
              label={tournament.status.replaceAll('_', ' ')}
              tone="neutral"
            />
          )}
        </View>

        <View style={styles.featuredBody}>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {tournament.title}
          </Text>
          <View style={styles.featuredMeta}>
            <Ionicons
              name="location"
              size={13}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.featuredMetaText} numberOfLines={1}>
              {[tournament.venue?.name, tournament.venue?.city]
                .filter(Boolean)
                .join(', ') || 'Venue to be announced'}
            </Text>
          </View>

          <View style={styles.featuredFooter}>
            <View style={styles.featuredEntrants}>
              {entrants.length ? (
                <AvatarStack
                  users={entrants}
                  total={tournament.entryCount}
                  size={28}
                  max={3}
                />
              ) : (
                <View style={styles.featuredCount}>
                  <Ionicons
                    name="people"
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.featuredCountText}>
                    {tournament.entryCount}{' '}
                    {tournament.entryCount === 1 ? 'entry' : 'entries'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.featuredCta}>
              <Text style={styles.featuredCtaText}>
                {tournament.isRegistrationOpen ? 'Join now' : 'View'}
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
    );
  },
);

export const ListSkeleton = React.memo(() => (
  <View style={styles.skeletonCard}>
    <Skeleton height={108} radius={0} />
    <View style={styles.skeletonBody}>
      <Skeleton height={13} width="80%" radius={theme.borderRadius.xs} />
      <Skeleton height={11} width="55%" radius={theme.borderRadius.xs} />
      <Skeleton height={11} width="65%" radius={theme.borderRadius.xs} />
    </View>
  </View>
));
