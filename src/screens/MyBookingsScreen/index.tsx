import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage } from '../../components/AppImage';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Skeleton } from '../../components/Skeleton';
import { theme } from '../../theme';
import type { BookingKind } from '../../types/tournament';
import { formatCountdown, formatDateTime, formatMoney, isListingLive } from '../../utils/format';

const filters = ['Upcoming', 'All', 'Past', 'Cancelled'] as const;
type Filter = (typeof filters)[number];

export function MyBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>('Upcoming');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      setError('');
      const data = await BackendAPI.getMyBookings();
      setBookings(data.bookings || []);
    } catch (requestError: any) {
      setError(requestError.message || 'Bookings could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const bucketOf = (item: any) => {
    const status = String(item.status).toUpperCase();
    if (status === 'CANCELLED' || status === 'WITHDRAWN') return 'Cancelled';
    return new Date(item.startsAt) >= new Date() ? 'Upcoming' : 'Past';
  };

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: bookings.length, Upcoming: 0, Past: 0, Cancelled: 0 };
    bookings.forEach((item) => { result[bucketOf(item)] += 1; });
    return result;
  }, [bookings]);

  const visible = useMemo(
    () =>
      bookings
        .filter((item) => {
          const title = item.kind === 'VENUE' ? item.venue?.name : item.event?.title;
          return (
            (filter === 'All' || bucketOf(item) === filter) &&
            String(title || '').toLowerCase().includes(query.trim().toLowerCase())
          );
        })
        // Soonest first for upcoming, most recent first for everything else.
        .sort((a, b) =>
          filter === 'Upcoming'
            ? new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
            : new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
        ),
    [bookings, filter, query],
  );

  const listData = useMemo(() => {
    if (loading) return [0, 1, 2];
    return visible;
  }, [loading, visible]);

  const renderItem = ({ item, index }: any) => {
    if (loading) {
      return (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Skeleton width={64} height={64} radius={theme.borderRadius.l} />
            <View style={{ flex: 1, gap: 9 }}>
              <Skeleton height={12} width="35%" radius={theme.borderRadius.xs} />
              <Skeleton height={15} width="70%" radius={theme.borderRadius.xs} />
              <Skeleton height={11} width="50%" radius={theme.borderRadius.xs} />
            </View>
          </View>
        </View>
      );
    }
    return (
      <Animated.View
        key={`${item.kind}-${item.id}`}
        entering={FadeInDown.delay(Math.min(index, 6) * theme.motion.stagger).duration(theme.motion.duration.normal)}
      >
        <BookingCard
          item={item}
          onPress={() =>
            navigation.navigate('BookingDetails', { kind: kindParam(item.kind), bookingId: item.id })
          }
        />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader navigation={navigation} title="My bookings" subtitle="Tickets, entries and reservations" />

      <FlatList
        data={listData}
        keyExtractor={(item, index) => (loading ? String(index) : `${item.kind}-${item.id}`)}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={5}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.m }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.search}>
              <Ionicons name="search" size={19} color={theme.colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search your bookings"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.searchInput}
                selectionColor={theme.colors.primary}
                accessibilityLabel="Search bookings"
              />
              {query ? (
                <PressableScale onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={19} color={theme.colors.textMuted} />
                </PressableScale>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {filters.map((item) => {
                const active = filter === item;
                return (
                  <PressableScale
                    key={item}
                    style={[styles.filter, active && styles.filterActive]}
                    onPress={() => { triggerHaptic('selection'); setFilter(item); }}
                    haptic="none"
                    scaleTo={0.94}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${item}, ${counts[item] ?? 0} bookings`}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
                    {counts[item] ? (
                      <View style={[styles.filterCount, active && styles.filterCountActive]}>
                        <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>{counts[item]}</Text>
                      </View>
                    ) : null}
                  </PressableScale>
                );
              })}
            </ScrollView>
          </>
        }
        ListEmptyComponent={
          !loading ? (
            error && !bookings.length ? (
              <EmptyState
                icon="cloud-offline-outline"
                tone="error"
                title="Unable to load bookings"
                message={error}
                actionLabel="Try again"
                onAction={() => load()}
              />
            ) : !visible.length ? (
              <EmptyState
                icon="ticket-outline"
                title={query ? `Nothing matches "${query}"` : `No ${filter.toLowerCase()} bookings`}
                message={
                  query
                    ? 'Try a different event or venue name.'
                    : 'Your event entries, tournament entries and venue reservations appear here.'
                }
                actionLabel={query ? 'Clear search' : 'Find something to join'}
                onAction={() => (query ? setQuery('') : navigation.navigate('MainTabs', { screen: 'Events' }))}
              />
            ) : null
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function kindParam(kind: string): BookingKind {
  return kind === 'TOURNAMENT' ? 'tournament' : kind === 'EVENT' ? 'event' : 'venue';
}

function BookingCard({ item, onPress }: any) {
  const isEvent = item.kind === 'EVENT';
  const isTournament = item.kind === 'TOURNAMENT';
  const event = isEvent || isTournament ? item.event : null;
  const venue = event?.venue || item.venue;
  const title = event?.title || item.venue?.name || 'Booking';
  const status = String(item.status).toUpperCase();
  const inactive = status === 'CANCELLED' || status === 'WITHDRAWN';
  const label = isTournament ? 'Tournament entry' : isEvent ? 'Event entry' : 'Venue reservation';
  const countdown = inactive ? null : formatCountdown(item.startsAt);
  const live = !inactive && isListingLive(item);

  const payment = isTournament
    ? inactive
      ? null
      : item.paymentPolicy === 'FREE'
        ? 'Free entry'
        : `${formatMoney(item.totalDueMinor, item.currency)} at venue`
    : isEvent && !inactive
      ? item.totalDueMinor > 0
        ? `${formatMoney(item.totalDueMinor, item.currency)} at venue`
        : 'Free entry'
      : !inactive
        ? 'Pay at venue'
        : null;

  return (
    <PressableScale
      style={[styles.card, inactive && styles.cardInactive]}
      scaleTo={0.985}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${title}`}
    >
      <View style={styles.cardTop}>
        <AppImage
          uri={event?.imageUrl || item.venue?.imageUrl}
          fallback={isTournament ? 'tournament' : isEvent ? 'event' : 'venue'}
          style={styles.cardImage}
        />
        <View style={styles.cardCopy}>
          <Text style={styles.kind}>
            {`${label}${isEvent && item.quantity > 1 ? ` · ${item.quantity} tickets` : ''}`.toUpperCase()}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.date}>{formatDateTime(item.startsAt, venue?.timeZone)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={theme.colors.textMuted} />
      </View>

      <View style={styles.cardFooter}>
        {live ? (
          <Badge label="Happening now" tone="live" />
        ) : inactive ? (
          <Badge label={status.replaceAll('_', ' ')} tone="error" />
        ) : countdown ? (
          <Badge label={countdown} tone="primary" caps={false} />
        ) : (
          <Badge label={status.replaceAll('_', ' ')} tone="neutral" />
        )}
        {payment ? <Text style={styles.payment}>{payment}</Text> : null}
        {venue ? (
          <View style={styles.venueRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
            <Text style={styles.venueText} numberOfLines={1}>
              {[venue.name, venue.city].filter(Boolean).join(', ')}
            </Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.gutter, paddingBottom: theme.spacing.xxl },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    height: 52,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, color: theme.colors.text, fontFamily: theme.font.regular, fontSize: 15, padding: 0 },

  filters: { gap: theme.spacing.s, paddingVertical: theme.spacing.m },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontFamily: theme.font.semibold },
  filterTextActive: { color: theme.colors.onPrimary, fontFamily: theme.font.bold },
  filterCount: {
    minWidth: 20,
    paddingHorizontal: 5,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceLight,
  },
  filterCountText: { ...theme.typography.caption, fontSize: 11, textAlign: 'center', fontFamily: theme.font.bold },
  filterCountActive: { backgroundColor: 'rgba(0,0,0,0.18)' },
  filterCountTextActive: { color: theme.colors.onPrimary },

  list: { gap: theme.spacing.m },
  card: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardInactive: { opacity: 0.72 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  cardImage: { width: 64, height: 64, borderRadius: theme.borderRadius.l, backgroundColor: theme.colors.surfaceLight },
  cardCopy: { flex: 1, minWidth: 0 },
  kind: { ...theme.typography.label, fontSize: 11, color: theme.colors.textMuted },
  cardTitle: { ...theme.typography.title, fontSize: 15, marginTop: 5 },
  date: { ...theme.typography.caption, marginTop: 4 },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  payment: { ...theme.typography.caption, color: theme.colors.warning, fontFamily: theme.font.semibold },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 120, justifyContent: 'flex-end' },
  venueText: { ...theme.typography.caption, fontSize: 11, flexShrink: 1 },
});
