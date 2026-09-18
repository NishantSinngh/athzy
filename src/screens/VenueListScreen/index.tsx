import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage, prefetchImages } from '../../components/AppImage';
import { EmptyState } from '../../components/EmptyState';
import { GridCard } from '../../components/GridCard';
import { FilterChip } from '../../components/FilterChip';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { RefreshBar } from '../../components/RefreshBar';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Skeleton } from '../../components/Skeleton';
import { theme } from '../../theme';
import { formatMoney } from '../../utils/format';

const sportFilters = ['All', 'Football', 'Cricket', 'Basketball', 'Tennis'];

/** Venues own cyan — spatial and map-like, the "book a slot" mode. */
const ACCENT = theme.accents.venue;

/**
 * Availability pill, driven by the real slot count the list endpoint now
 * returns. `availability` is null when a venue's timezone could not be
 * resolved, in which case the card renders without a pill rather than guessing.
 */
function availabilityOf(venue: any): { label: string; tone: 'good' | 'warn' } | undefined {
  const availability = venue.availability;
  if (!availability) return undefined;

  if (availability.status === 'FULL') return { label: 'Fully booked today', tone: 'warn' };
  if (availability.status === 'LIMITED') {
    return {
      label: `${availability.slotsToday} ${availability.slotsToday === 1 ? 'slot' : 'slots'} left`,
      tone: 'warn',
    };
  }
  return { label: 'Available today', tone: 'good' };
}

export const VenueListScreen = ({ navigation, route }: any) => {
  // Rendered both as a pushed screen and as the Venues tab root.
  const isTabRoot = Boolean(route?.params?.tabRoot);
  const insets = useSafeAreaInsets();
  const [venues, setVenues] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      setError('');
      const data = await BackendAPI.getVenues();
      setVenues(data.venues || []);
      prefetchImages((data.venues || []).slice(0, 8).map((venue: any) => venue.imageUrl));
    } catch (requestError: any) {
      setError(requestError.message || 'Venues could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(
    () =>
      venues.filter((venue) => {
        const haystack = `${venue.name} ${venue.city} ${(venue.sports || []).join(' ')}`.toLowerCase();
        const matchesQuery = haystack.includes(query.trim().toLowerCase());
        const matchesFilter = filter === 'All' || (venue.sports || []).includes(filter.toLowerCase());
        return matchesQuery && matchesFilter;
      }),
    [filter, query, venues],
  );

  const submitSearch = () => {
    const value = query.trim();
    if (!value) return;
    setRecentSearches((current) => [value, ...current.filter((item) => item !== value)].slice(0, 5));
    setSearching(false);
  };

  const listData = useMemo(() => {
    if (searching) return [];
    if (loading) return [0, 1, 2, 3];
    return visible;
  }, [loading, searching, visible]);

  const renderItem = ({ item, index }: any) => {
    if (loading) {
      return (
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
      );
    }
    return (
      <Animated.View
        key={item.id}
        style={styles.gridCell}
        entering={FadeInDown.delay(Math.min(index, 8) * theme.motion.stagger).duration(theme.motion.duration.normal)}
      >
        <GridCard
          accent={ACCENT}
          imageUrl={item.imageUrl}
          fallback="venue"
          status={availabilityOf(item)}
          title={item.name}
          subtitle={(item.sports || []).map((s: string) => s.replace('-', ' ')).join(' · ') || 'Multi-sport'}
          place={item.city}
          priceLabel="STARTING PRICE"
          price={formatMoney(item.basePriceMinor, item.currency)}
          priceSuffix=" /hr"
          rating={typeof item.rating === 'number' ? item.rating : undefined}
          onPress={() => navigation.navigate('VenueDetails', { venueId: item.id })}
        />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshBar active={refreshing} accent={ACCENT} />
      <ScreenHeader
        navigation={navigation}
        title={searching ? 'Search venues' : 'Venues'}
        subtitle={searching ? undefined : 'Book courts, pitches and grounds near you'}
        showBack={!isTabRoot}
      />

      <FlatList
        key={`venues-list-${searching}-${loading}`}
        data={listData}
        keyExtractor={(item, index) => (loading ? String(index) : item.id)}
        renderItem={renderItem}
        numColumns={searching ? 1 : 2}
        columnWrapperStyle={!searching ? styles.columnWrapper : undefined}
        contentContainerStyle={[styles.content, isTabRoot && { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={6}
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
            <View style={styles.searchRow}>
              <View style={[styles.search, searching && styles.searchActive]}>
                <Ionicons name="search" size={19} color={searching ? ACCENT.base : theme.colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onFocus={() => setSearching(true)}
                  onSubmitEditing={submitSearch}
                  returnKeyType="search"
                  placeholder="Search venues or cities"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.searchInput}
                  selectionColor={theme.colors.primary}
                  accessibilityLabel="Search venues"
                />
                {query ? (
                  <PressableScale onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={19} color={theme.colors.textMuted} />
                  </PressableScale>
                ) : null}
              </View>
              {searching ? (
                <PressableScale
                  onPress={() => { setSearching(false); setQuery(''); }}
                  haptic="selection"
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel search"
                >
                  <Text style={styles.cancel}>Cancel</Text>
                </PressableScale>
              ) : null}
            </View>

            {searching ? (
              <Animated.View entering={FadeIn.duration(theme.motion.duration.fast)}>
                {recentSearches.length ? (
                  <>
                    <View style={styles.headingRow}>
                      <Text style={styles.heading}>Recent searches</Text>
                      <PressableScale
                        onPress={() => setRecentSearches([])}
                        haptic="selection"
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Clear recent searches"
                      >
                        <Text style={styles.clear}>Clear all</Text>
                      </PressableScale>
                    </View>
                    {recentSearches.map((item) => (
                      <PressableScale
                        key={item}
                        style={styles.recent}
                        scaleTo={0.99}
                        onPress={() => { setQuery(item); setSearching(false); }}
                        accessibilityRole="button"
                        accessibilityLabel={`Search ${item}`}
                      >
                        <Ionicons name="time-outline" size={18} color={theme.colors.textMuted} />
                        <Text style={styles.recentText}>{item}</Text>
                        <Ionicons name="arrow-forward" size={15} color={theme.colors.textMuted} />
                      </PressableScale>
                    ))}
                  </>
                ) : null}

                <Text style={styles.heading}>Popular sports</Text>
                <View style={styles.popular}>
                  {sportFilters.slice(1).map((item) => (
                    <PressableScale
                      key={item}
                      style={styles.popularChip}
                      scaleTo={0.94}
                      onPress={() => { setFilter(item); setQuery(item); setSearching(false); }}
                      accessibilityRole="button"
                      accessibilityLabel={`Browse ${item} venues`}
                    >
                      <Ionicons name="football-outline" size={15} color={ACCENT.base} />
                      <Text style={styles.popularText}>{item}</Text>
                    </PressableScale>
                  ))}
                </View>

                {visible.length ? (
                  <>
                    <Text style={styles.heading}>Top rated</Text>
                    {visible.slice(0, 4).map((venue) => (
                      <PressableScale
                        key={venue.id}
                        style={styles.trending}
                        scaleTo={0.985}
                        onPress={() => navigation.navigate('VenueDetails', { venueId: venue.id })}
                        accessibilityRole="button"
                        accessibilityLabel={venue.name}
                      >
                        <AppImage uri={venue.imageUrl} fallback="venue" style={styles.trendingImage} />
                        <View style={styles.trendingCopy}>
                          <Text style={styles.trendingTitle} numberOfLines={1}>{venue.name}</Text>
                          <Text style={styles.trendingMeta} numberOfLines={1}>
                            {(venue.sports || []).join(' · ') || 'Multi-sport'} · {venue.city}
                          </Text>
                        </View>
                        {typeof venue.rating === 'number' ? (
                          <View style={styles.trendingRating}>
                            <Ionicons name="star" size={12} color={theme.colors.warning} />
                            <Text style={styles.trendingRatingText}>{venue.rating.toFixed(1)}</Text>
                          </View>
                        ) : null}
                      </PressableScale>
                    ))}
                  </>
                ) : null}
              </Animated.View>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                  {sportFilters.map((item) => (
                    <FilterChip
                      key={item}
                      accent={ACCENT}
                      label={item}
                      active={filter === item}
                      onPress={() => setFilter(item)}
                    />
                  ))}
                </ScrollView>

                <Text style={styles.count}>
                  Venues
                </Text>
              </>
            )}
          </>
        }
        ListEmptyComponent={
          !loading && !searching ? (
            error ? (
              <EmptyState
                icon="cloud-offline-outline"
                tone="error"
                title="Unable to load venues"
                message={error}
                actionLabel="Try again"
                onAction={() => load()}
              />
            ) : !visible.length ? (
              <EmptyState
                icon="business-outline"
                title="No venues found"
                message="Try another sport or search term."
                actionLabel={filter !== 'All' || query ? 'Clear filters' : undefined}
                onAction={() => { setFilter('All'); setQuery(''); }}
              />
            ) : null
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.gutter, paddingBottom: theme.spacing.xxl },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, marginBottom: theme.spacing.m },
  search: {
    flex: 1,
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
  searchActive: { borderColor: ACCENT.soft, backgroundColor: theme.colors.surfaceRaised },
  searchInput: { flex: 1, color: theme.colors.text, fontFamily: theme.font.regular, fontSize: 15, padding: 0 },
  cancel: { ...theme.typography.bodySmall, color: ACCENT.base, fontFamily: theme.font.semibold },

  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.m, marginTop: theme.spacing.l },
  heading: { ...theme.typography.h3, fontSize: 16, marginTop: theme.spacing.l, marginBottom: theme.spacing.m },
  clear: { ...theme.typography.caption, color: ACCENT.base, fontFamily: theme.font.bold },

  recent: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, minHeight: 48 },
  recentText: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1 },

  popular: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  popularText: { ...theme.typography.caption, color: theme.colors.text, fontFamily: theme.font.semibold },

  trending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.s,
    marginBottom: theme.spacing.s,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  trendingImage: { width: 60, height: 60, borderRadius: theme.borderRadius.m, backgroundColor: theme.colors.surfaceLight },
  trendingCopy: { flex: 1, minWidth: 0 },
  trendingTitle: { ...theme.typography.title, fontSize: 14 },
  trendingMeta: { ...theme.typography.caption, marginTop: 3, textTransform: 'capitalize' },
  trendingRating: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: theme.spacing.s },
  trendingRatingText: { ...theme.typography.caption, color: theme.colors.text, fontFamily: theme.font.bold },

  filters: { gap: theme.spacing.s, paddingVertical: theme.spacing.s },

  count: { ...theme.typography.h3, marginTop: theme.spacing.m, marginBottom: theme.spacing.m },

  list: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.m },
  gridCell: { width: '47%', flexGrow: 1 },
  columnWrapper: { gap: theme.spacing.m, marginBottom: theme.spacing.m },
  skeletonBody: { padding: theme.spacing.s, gap: 6 },
  card: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },


});
