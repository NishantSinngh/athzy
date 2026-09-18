import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { HeroReveal } from '../../components/HeroReveal';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SectionHeader } from '../../components/SectionHeader';
import { Skeleton } from '../../components/Skeleton';
import { showToast } from '../../components/Toast';
import { theme } from '../../theme';

/** Matches the Venues tab accent. */
const ACCENT = theme.accents.venue;
import { formatLocalDate, formatMoney, formatTime } from '../../utils/format';

const amenityIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Parking: 'car-outline',
  Cafe: 'cafe-outline',
  Floodlights: 'flash-outline',
  Showers: 'water-outline',
  Lockers: 'lock-closed-outline',
  Seating: 'people-outline',
};

export const VenueDetailsScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [venue, setVenue] = useState<any>(null);
  const [sports, setSports] = useState<any[]>([]);
  const [sport, setSport] = useState<any>(null);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);

  const loadVenue = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [venueData, sportsData] = await Promise.all([
        BackendAPI.getVenue(route.params?.venueId),
        BackendAPI.getSports(),
      ]);
      const supported = (sportsData.sports || []).filter(
        (item: any) => !(venueData.venue.sports || []).length || venueData.venue.sports.includes(item.slug),
      );
      setVenue(venueData.venue);
      setSports(supported);
      setSport(supported[0] || null);
      setSelectedDate(venueData.venue.currentLocalDate);
      setDurationMinutes(venueData.venue.minBookingDurationMinutes || 60);
    } catch (error: any) {
      setLoadError(error.message || 'Unable to load this venue.');
    } finally {
      setLoading(false);
    }
  }, [route.params?.venueId]);

  useEffect(() => { loadVenue(); }, [loadVenue]);

  useEffect(() => {
    if (!venue || !sport || !selectedDate) return;
    let active = true;
    setSelectedSlot(null);
    setAvailabilityLoading(true);
    setAvailabilityError('');
    BackendAPI.getVenueAvailability(venue.id, { date: selectedDate, durationMinutes, sportId: sport.id })
      .then((result: any) => { if (active) setAvailability(result.availability); })
      .catch((error: any) => {
        if (active) {
          setAvailability(null);
          setAvailabilityError(error.message || 'Availability could not be loaded.');
        }
      })
      .finally(() => { if (active) setAvailabilityLoading(false); });
    return () => { active = false; };
  }, [availabilityAttempt, durationMinutes, selectedDate, sport?.id, venue?.id]);

  if (loading) return <VenueSkeleton navigation={navigation} />;

  if (!venue) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader navigation={navigation} title="Venue" />
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Unable to load venue"
          message={loadError}
          actionLabel="Try again"
          onAction={loadVenue}
        />
      </SafeAreaView>
    );
  }

  const dates = Array.from({ length: 7 }, (_, index) => addDays(venue.currentLocalDate, index));
  const durations = Array.from(
    {
      length:
        Math.floor((venue.maxBookingDurationMinutes - venue.minBookingDurationMinutes) / venue.slotIntervalMinutes) + 1,
    },
    (_, index) => venue.minBookingDurationMinutes + index * venue.slotIntervalMinutes,
  );

  const openDirections = () =>
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.address}`)}`,
    ).catch(() => showToast({ message: 'Could not open maps on this device.', tone: 'error' }));

  const availableCount = (availability?.slots || []).filter((slot: any) => slot.available).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        navigation={navigation}
        title={venue.name}
        right={
          <PressableScale
            style={styles.headerButton}
            onPress={() => Share.share({ message: `${venue.name}, ${venue.address}` }).catch(() => undefined)}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Share venue"
          >
            <Ionicons name="share-social-outline" size={19} color={theme.colors.text} />
          </PressableScale>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <HeroReveal style={styles.hero}>
            <AppImage uri={venue.imageUrl} fallback="venue" style={styles.hero} priority="high" />
          </HeroReveal>
          <LinearGradient colors={theme.gradients.imageScrim} style={StyleSheet.absoluteFill} />
          <View style={styles.heroBody}>
            <Text style={styles.title}>{venue.name}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location" size={14} color={theme.colors.primary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {venue.address}, {venue.city}
              </Text>
            </View>
          </View>
          {typeof venue.rating === 'number' ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={13} color={theme.colors.warning} />
              <Text style={styles.ratingText}>{venue.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {sports.length ? (
          <View style={styles.block}>
            <SectionHeader title="Sport" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {sports.map((item) => {
                const active = sport?.id === item.id;
                return (
                  <PressableScale
                    key={item.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => { triggerHaptic('selection'); setSport(item); }}
                    haptic="none"
                    scaleTo={0.94}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={item.name}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Duration" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {durations.map((value) => {
              const active = durationMinutes === value;
              return (
                <PressableScale
                  key={value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => { triggerHaptic('selection'); setDurationMinutes(value); }}
                  haptic="none"
                  scaleTo={0.94}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={durationLabel(value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{durationLabel(value)}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Date" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {dates.map((date, index) => {
              const active = selectedDate === date;
              return (
                <PressableScale
                  key={date}
                  style={[styles.date, active && styles.dateActive]}
                  onPress={() => { triggerHaptic('selection'); setSelectedDate(date); }}
                  haptic="none"
                  scaleTo={0.94}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={formatLocalDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
                >
                  <Text style={[styles.dateWeek, active && styles.dateTextActive]}>
                    {index === 0 ? 'TODAY' : formatLocalDate(date, { weekday: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={[styles.dateDay, active && styles.dateTextActive]}>
                    {formatLocalDate(date, { day: 'numeric' })}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.block}>
          <SectionHeader
            title="Available slots"
            subtitle={
              availabilityLoading
                ? 'Checking availability…'
                : availableCount
                  ? `${availableCount} open ${availableCount === 1 ? 'slot' : 'slots'}`
                  : undefined
            }
          />

          {availabilityLoading ? (
            <View style={styles.slots}>
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} height={46} radius={theme.borderRadius.m} style={{ width: '31%' }} />
              ))}
            </View>
          ) : availabilityError ? (
            <EmptyState
              compact
              icon="cloud-offline-outline"
              tone="error"
              title="Availability unavailable"
              message={availabilityError}
              actionLabel="Try again"
              onAction={() => setAvailabilityAttempt((value) => value + 1)}
            />
          ) : availability?.slots?.length ? (
            <View style={styles.slots}>
              {availability.slots.map((item: any) => {
                const active = selectedSlot?.startsAt === item.startsAt;
                return (
                  <PressableScale
                    key={item.startsAt}
                    disabled={!item.available}
                    style={[styles.slot, !item.available && styles.slotDisabled, active && styles.slotActive]}
                    onPress={() => { triggerHaptic('medium'); setSelectedSlot(item); }}
                    haptic="none"
                    scaleTo={0.94}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: !item.available }}
                    accessibilityLabel={`${formatTime(item.startsAt, venue.timeZone)}${item.available ? '' : ', unavailable'}`}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive]}>
                      {formatTime(item.startsAt, venue.timeZone)}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          ) : (
            <EmptyState
              compact
              icon="calendar-outline"
              title="Nothing open"
              message="No slots are available for this date and duration. Try another day."
            />
          )}
        </View>

        {venue.description ? (
          <View style={styles.block}>
            <SectionHeader title="About" />
            <Text style={styles.description}>{venue.description}</Text>
          </View>
        ) : null}

        {(venue.amenities || []).length ? (
          <View style={styles.block}>
            <SectionHeader title="Amenities" />
            <View style={styles.amenities}>
              {venue.amenities.map((item: string) => (
                <View key={item} style={styles.amenity}>
                  <Ionicons name={amenityIcons[item] || 'checkmark-circle-outline'} size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.amenityText} numberOfLines={1}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Hourly pricing" />
          <View style={styles.pricing}>
            <View style={styles.priceLine}>
              <Text style={styles.priceName}>Standard</Text>
              <Text style={styles.priceValue}>{formatMoney(venue.basePriceMinor, venue.currency)}/hr</Text>
            </View>
            <View style={[styles.priceLine, styles.priceLineLast]}>
              <View style={styles.priceNameRow}>
                <Text style={styles.priceName}>Peak</Text>
                <Badge label="Evenings & weekends" tone="neutral" caps={false} />
              </View>
              <Text style={styles.priceValue}>{formatMoney(venue.peakPriceMinor, venue.currency)}/hr</Text>
            </View>
          </View>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Location" />
          <PressableScale
            style={styles.map}
            scaleTo={0.985}
            onPress={openDirections}
            accessibilityRole="button"
            accessibilityLabel={`Get directions to ${venue.name}`}
          >
            <View style={styles.mapIcon}>
              <Ionicons name="navigate" size={22} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.mapCopy}>
              <Text style={styles.mapTitle}>Get directions</Text>
              <Text style={styles.mapText} numberOfLines={2}>{venue.address}, {venue.city}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </PressableScale>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.m) }]}>
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>{selectedSlot ? 'PAY AT VENUE' : 'SELECT A SLOT'}</Text>
          <Text style={styles.totalValue}>
            {selectedSlot ? formatMoney(selectedSlot.totalMinor, selectedSlot.currency) : '—'}
          </Text>
        </View>
        <Button
          title="Book now"
          trailingIconName="arrow-forward"
          onPress={() =>
            sport && selectedSlot &&
            navigation.navigate('VenueBookingReview', { venue, sport, slot: selectedSlot, durationMinutes })
          }
          disabled={!selectedSlot || availabilityLoading}
          style={styles.bookButton}
        />
      </View>

      {selectedSlot ? (
        <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)} pointerEvents="none" style={styles.slotHint}>
          <Ionicons name="information-circle" size={14} color={ACCENT.base} />
          <Text style={styles.slotHintText}>Nothing is charged online</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
};

function VenueSkeleton({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title="Venue" />
      <View style={styles.content}>
        <Skeleton height={260} radius={theme.borderRadius.xxl} />
        <View style={{ height: theme.spacing.xl }} />
        <Skeleton height={20} width="40%" radius={theme.borderRadius.xs} />
        <View style={{ height: theme.spacing.m }} />
        <View style={styles.chipRow}>
          {[0, 1, 2].map((key) => <Skeleton key={key} width={92} height={44} radius={theme.borderRadius.round} />)}
        </View>
      </View>
    </SafeAreaView>
  );
}

function addDays(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function durationLabel(value: number) {
  return value % 60 ? `${Math.floor(value / 60)}h ${value % 60}m` : `${value / 60} hour${value === 60 ? '' : 's'}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.gutter, paddingBottom: 130 },

  headerButton: {
    width: theme.hitTarget,
    height: theme.hitTarget,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  heroWrap: {
    height: 260,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.surface,
  },
  hero: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroBody: { padding: theme.spacing.m },
  title: { ...theme.typography.h2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.s },
  metaText: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1 },
  rating: {
    position: 'absolute',
    top: theme.spacing.m,
    right: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(10,10,10,0.78)',
  },
  ratingText: { ...theme.typography.caption, color: theme.colors.text, fontFamily: theme.font.bold },

  block: { marginTop: theme.spacing.xl },

  chipRow: { gap: theme.spacing.s, paddingBottom: 2 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: { backgroundColor: ACCENT.muted, borderColor: ACCENT.soft },
  chipText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontFamily: theme.font.semibold },
  chipTextActive: { color: ACCENT.base, fontFamily: theme.font.bold },

  date: {
    width: 66,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateActive: { backgroundColor: ACCENT.muted, borderColor: ACCENT.base },
  dateWeek: { ...theme.typography.label, fontSize: 11 },
  dateDay: { ...theme.typography.numeric, fontSize: 20, marginTop: 3 },
  dateTextActive: { color: ACCENT.base },

  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  slot: {
    width: '31%',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  slotActive: { backgroundColor: ACCENT.muted, borderColor: ACCENT.base },
  slotDisabled: { opacity: 0.3 },
  slotText: { ...theme.typography.caption, color: theme.colors.text, fontFamily: theme.font.semibold },
  slotTextActive: { color: ACCENT.base, fontFamily: theme.font.bold },

  description: { ...theme.typography.bodyLarge, fontSize: 15 },

  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  amenityText: { ...theme.typography.caption, color: theme.colors.text, fontFamily: theme.font.semibold },

  pricing: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  priceLineLast: { borderBottomWidth: 0 },
  priceNameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, flexShrink: 1 },
  priceName: { ...theme.typography.bodySmall, color: theme.colors.text, fontFamily: theme.font.semibold },
  priceValue: { ...theme.typography.title, fontSize: 15, color: ACCENT.base },

  map: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mapIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  mapCopy: { flex: 1, minWidth: 0 },
  mapTitle: { ...theme.typography.title, fontSize: 14 },
  mapText: { ...theme.typography.caption, marginTop: 3 },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalBlock: { minWidth: 90 },
  totalLabel: { ...theme.typography.label, fontSize: 11 },
  totalValue: { ...theme.typography.numeric, fontSize: 20, color: theme.colors.primary, marginTop: 2 },
  bookButton: { flex: 1 },

  slotHint: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.round,
    backgroundColor: ACCENT.muted,
    borderWidth: 1,
    borderColor: ACCENT.soft,
  },
  slotHintText: { ...theme.typography.caption, color: ACCENT.base, fontSize: 11 },
});
