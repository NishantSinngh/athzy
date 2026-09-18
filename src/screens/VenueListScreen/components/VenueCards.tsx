import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GridCard } from '../../../components/GridCard';
import { AppImage } from '../../../components/AppImage';
import { Skeleton } from '../../../components/Skeleton';
import { PressableScale } from '../../../components/PressableScale';
import { theme } from '../../../theme';
import { formatMoney } from '../../../utils/format';
import { ACCENT, styles } from '../styles';

function availabilityOf(
  venue: any,
): { label: string; tone: 'good' | 'warn' } | undefined {
  const availability = venue.availability;
  if (!availability) return undefined;

  if (availability.status === 'FULL')
    return { label: 'Fully booked today', tone: 'warn' };
  if (availability.status === 'LIMITED') {
    return {
      label: `${availability.slotsToday} ${
        availability.slotsToday === 1 ? 'slot' : 'slots'
      } left`,
      tone: 'warn',
    };
  }
  return { label: 'Available today', tone: 'good' };
}

export const VenueGridCard = React.memo(({ venue, onPress }: any) => {
  return (
    <GridCard
      accent={ACCENT}
      imageUrl={venue.imageUrl}
      fallback="venue"
      status={availabilityOf(venue)}
      title={venue.name}
      subtitle={
        (venue.sports || [])
          .map((s: string) => s.replace('-', ' '))
          .join(' · ') || 'Multi-sport'
      }
      place={venue.city}
      priceLabel="STARTING PRICE"
      price={formatMoney(venue.basePriceMinor, venue.currency)}
      priceSuffix=" /hr"
      rating={typeof venue.rating === 'number' ? venue.rating : undefined}
      onPress={() => onPress(venue.id)}
    />
  );
});

export const TrendingVenueRow = React.memo(({ venue, onPress }: any) => {
  return (
    <PressableScale
      style={styles.trending}
      scaleTo={0.985}
      onPress={() => onPress(venue.id)}
      accessibilityRole="button"
      accessibilityLabel={venue.name}
    >
      <AppImage
        uri={venue.imageUrl}
        fallback="venue"
        style={styles.trendingImage}
      />
      <View style={styles.trendingCopy}>
        <Text style={styles.trendingTitle} numberOfLines={1}>
          {venue.name}
        </Text>
        <Text style={styles.trendingMeta} numberOfLines={1}>
          {(venue.sports || []).join(' · ') || 'Multi-sport'} · {venue.city}
        </Text>
      </View>
      {typeof venue.rating === 'number' ? (
        <View style={styles.trendingRating}>
          <Ionicons name="star" size={12} color={theme.colors.warning} />
          <Text style={styles.trendingRatingText}>
            {venue.rating.toFixed(1)}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
});

export const ListSkeleton = React.memo(() => (
  <View style={styles.gridCell}>
    <View style={styles.card}>
      <Skeleton height={108} radius={0} />
      <View style={styles.skeletonBody}>
        <Skeleton height={13} width="80%" radius={theme.borderRadius.xs} />
        <Skeleton height={11} width="55%" radius={theme.borderRadius.xs} />
        <Skeleton height={11} width="65%" radius={theme.borderRadius.xs} />
      </View>
    </View>
  </View>
));
