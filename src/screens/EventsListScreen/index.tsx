import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BackendAPI } from '../../api/backend';
import { AppImage, prefetchImages } from '../../components/AppImage';
import { AvatarStack } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { FilterChip } from '../../components/FilterChip';
import { GridCard } from '../../components/GridCard';
import { SportRail } from '../../components/SportRail';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { RefreshBar } from '../../components/RefreshBar';
import { Skeleton } from '../../components/Skeleton';
import { theme } from '../../theme';
import type { Tournament } from '../../types/tournament';
import {
  formatCountdown,
  formatDateTime,
  formatMoney,
  isListingLive,
} from '../../utils/format';

type DiscoverTab = 'EVENTS' | 'TOURNAMENTS';
type DateFilter = 'All dates' | 'Today' | 'Tomorrow' | 'This weekend';

const dateFilters: DateFilter[] = [
  'All dates',
  'Today',
  'Tomorrow',
  'This weekend',
];

/** Discover owns amber — scheduled, anticipatory. */
const ACCENT = theme.accents.discover;

export function EventsListScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<DiscoverTab>(
    route.params?.tab === 'TOURNAMENTS' ? 'TOURNAMENTS' : 'EVENTS',
  );
  const [events, setEvents] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [query, setQuery] = useState(route.params?.query || '');
  const [sport, setSport] = useState(route.params?.sportName || 'All sports');
  const [dateFilter, setDateFilter] = useState<DateFilter>('All dates');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventError, setEventError] = useState('');
  const [tournamentError, setTournamentError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    const [eventResult, tournamentResult] = await Promise.allSettled([
      BackendAPI.getEvents(),
      BackendAPI.getTournaments({ take: 50 }),
    ]);

    if (eventResult.status === 'fulfilled') {
      const list = (eventResult.value.events || []).filter(
        (event: any) => !event.tournament,
      );
      setEvents(list);
      setEventError('');
      prefetchImages(list.slice(0, 8).map((event: any) => event.imageUrl));
    } else {
      setEventError(
        eventResult.reason?.message || 'Events could not be loaded.',
      );
    }

    if (tournamentResult.status === 'fulfilled') {
      setTournaments(tournamentResult.value.tournaments || []);
      setTournamentError('');
    } else {
      setTournamentError(
        tournamentResult.reason?.message || 'Tournaments could not be loaded.',
      );
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (route.params?.sportName) setSport(route.params.sportName);
    if (route.params?.query !== undefined) setQuery(route.params.query);
    if (route.params?.tab) setTab(route.params.tab);
  }, [route.params?.query, route.params?.sportName, route.params?.tab]);

  const allItems = tab === 'EVENTS' ? events : tournaments;

  const sports = useMemo(
    () => [
      'All sports',
      ...Array.from(
        new Set(
          [...events, ...tournaments]
            .map((item: any) => item.sport?.name)
            .filter(Boolean),
        ),
      ),
    ],
    [events, tournaments],
  );

  const visible = useMemo(
    () =>
      allItems.filter((item: any) => {
        const text = [
          item.title,
          item.sport?.name,
          item.venue?.name,
          item.venue?.city,
          item.format,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return (
          text.includes(query.trim().toLowerCase()) &&
          (sport === 'All sports' || item.sport?.name === sport) &&
          matchesDate(item.startsAt, dateFilter)
        );
      }),
    [allItems, dateFilter, query, sport],
  );

  // The design leads Tournaments with a single hero: prefer one with open
  // registration, since that is the one a tap can actually act on.
  const featured = useMemo(() => {
    if (tab !== 'TOURNAMENTS') return null;
    return (
      visible.find((item: any) => item.isRegistrationOpen) ?? visible[0] ?? null
    );
  }, [tab, visible]);
  const upcoming = useMemo(
    () =>
      tab === 'TOURNAMENTS'
        ? visible.filter((item: any) => item.id !== featured?.id)
        : [],
    [featured, tab, visible],
  );

  const error = tab === 'EVENTS' ? eventError : tournamentError;
  const filtersActive =
    Boolean(query) || sport !== 'All sports' || dateFilter !== 'All dates';

  const clearFilters = () => {
    triggerHaptic('medium');
    setQuery('');
    setSport('All sports');
    setDateFilter('All dates');
  };

  const listData = useMemo(() => {
    if (loading) return [0, 1, 2, 3];
    if (tab === 'EVENTS') return visible;
    return upcoming;
  }, [loading, tab, visible, upcoming]);

  const renderItem = ({ item, index }: any) => {
    if (loading)
      return (
        <View style={styles.gridCell}>
          <ListSkeleton />
        </View>
      );
    if (tab === 'EVENTS') {
      return (
        <Animated.View
          style={styles.gridCell}
          entering={FadeInDown.delay(
            Math.min(index, 8) * theme.motion.stagger,
          ).duration(theme.motion.duration.normal)}
        >
          <EventGridCard
            event={item}
            onPress={() =>
              navigation.navigate('EventDetails', { eventId: item.id })
            }
          />
        </Animated.View>
      );
    }
    return (
      <Animated.View
        entering={FadeInDown.delay(
          Math.min(index, 8) * theme.motion.stagger,
        ).duration(theme.motion.duration.normal)}
      >
        <UpcomingGameRow
          tournament={item}
          onPress={() =>
            navigation.navigate('TournamentDetails', { tournamentId: item.id })
          }
        />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshBar active={refreshing} accent={ACCENT} />
      <FlatList
        key={`discover-list-${tab}-${loading}`}
        data={listData}
        keyExtractor={(item, index) => (loading ? String(index) : item.id)}
        renderItem={renderItem}
        numColumns={tab === 'EVENTS' || loading ? 2 : 1}
        columnWrapperStyle={
          tab === 'EVENTS' || loading ? styles.columnWrapper : undefined
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110 },
        ]}
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
            <Text style={styles.title} accessibilityRole="header">
              Discover
            </Text>
            <Text style={styles.subtitle}>
              Find games, leagues and tournaments near you
            </Text>

            <View style={styles.segments}>
              {(['EVENTS', 'TOURNAMENTS'] as DiscoverTab[]).map(item => {
                const active = tab === item;
                return (
                  <PressableScale
                    key={item}
                    style={[styles.segment, active && styles.segmentActive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setTab(item);
                    }}
                    haptic="none"
                    scaleTo={0.97}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={
                      item === 'EVENTS' ? 'Events' : 'Tournaments'
                    }
                  >
                    <Ionicons
                      name={
                        item === 'EVENTS'
                          ? 'calendar-outline'
                          : 'trophy-outline'
                      }
                      size={17}
                      color={active ? ACCENT.base : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {item === 'EVENTS' ? 'Events' : 'Tournaments'}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            <View style={styles.search}>
              <Ionicons
                name="search"
                size={19}
                color={theme.colors.textMuted}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={
                  tab === 'EVENTS'
                    ? 'Search events, sports or venues'
                    : 'Search tournaments or formats'
                }
                placeholderTextColor={theme.colors.textMuted}
                style={styles.searchInput}
                selectionColor={theme.colors.primary}
                accessibilityLabel="Search"
              />
              {query ? (
                <PressableScale
                  onPress={() => setQuery('')}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons
                    name="close-circle"
                    size={19}
                    color={theme.colors.textMuted}
                  />
                </PressableScale>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {dateFilters.map(item => (
                <FilterChip
                  key={item}
                  accent={ACCENT}
                  label={item}
                  active={dateFilter === item}
                  onPress={() => {
                    triggerHaptic('selection');
                    setDateFilter(item);
                  }}
                />
              ))}
            </ScrollView>

            <SportRail
              accent={ACCENT}
              sports={sports
                .filter(item => item !== 'All sports')
                .map(item => ({ id: item, name: item, slug: item }))}
              selected={sport === 'All sports' ? undefined : sport}
              onSelect={name => setSport(name ?? 'All sports')}
            />

            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {tab === 'EVENTS' ? 'Events' : 'Tournaments'}
              </Text>
              {filtersActive ? (
                <PressableScale
                  style={styles.clear}
                  onPress={clearFilters}
                  haptic="none"
                  accessibilityRole="button"
                  accessibilityLabel="Clear all filters"
                >
                  <Ionicons name="close" size={13} color={ACCENT.base} />
                  <Text style={styles.clearText}>Clear filters</Text>
                </PressableScale>
              ) : null}
            </View>

            {tab === 'TOURNAMENTS' &&
            featured &&
            !loading &&
            !error &&
            visible.length ? (
              <Animated.View
                entering={FadeInDown.duration(theme.motion.duration.normal)}
              >
                <Text style={styles.blockHeading}>Featured tournament</Text>
                <FeaturedTournament
                  tournament={featured}
                  onPress={() =>
                    navigation.navigate('TournamentDetails', {
                      tournamentId: featured.id,
                    })
                  }
                />
                {upcoming.length ? (
                  <Text style={styles.blockHeading}>Upcoming games</Text>
                ) : null}
              </Animated.View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            error && !allItems.length ? (
              <EmptyState
                icon="cloud-offline-outline"
                tone="error"
                title={`Unable to load ${tab.toLowerCase()}`}
                message={error}
                actionLabel="Try again"
                onAction={() => load()}
              />
            ) : !visible.length ? (
              <EmptyState
                icon={tab === 'EVENTS' ? 'calendar-outline' : 'trophy-outline'}
                title={`No ${tab.toLowerCase()} found`}
                message="Try a different search, sport, or date filter."
                actionLabel={filtersActive ? 'Clear filters' : undefined}
                onAction={filtersActive ? clearFilters : undefined}
              />
            ) : null
          ) : null
        }
        ListFooterComponent={
          error && allItems.length ? (
            <PressableScale
              style={styles.inlineError}
              onPress={() => load()}
              accessibilityRole="button"
              accessibilityLabel="Retry"
            >
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={theme.colors.warning}
              />
              <Text style={styles.inlineErrorText}>
                Some results may be stale. Tap to retry.
              </Text>
            </PressableScale>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

/** Half-width event card matching the Discover grid in the design. */
function EventGridCard({ event, onPress }: any) {
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
      onPress={onPress}
    />
  );
}

/**
 * Full-bleed hero for the leading tournament: image, live-registration flag,
 * entrant avatars and a direct call to action.
 */
function FeaturedTournament({
  tournament,
  onPress,
}: {
  tournament: Tournament;
  onPress: () => void;
}) {
  const entrants = (tournament.entries ?? [])
    .map((entry: any) => entry.registrant)
    .filter(Boolean)
    .slice(0, 4);

  return (
    <PressableScale
      style={styles.featured}
      scaleTo={0.985}
      onPress={onPress}
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
          {/* The list endpoint returns only a count, not the entrants, so the
              avatar stack appears when we have faces and a plain count when we
              don't — a lone "+138" with no faces reads as a bug. */}
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
}

/**
 * Compact row from the design's "Upcoming Games" list: thumbnail, name, sport,
 * kickoff, and a status pill on the right.
 */
function UpcomingGameRow({
  tournament,
  onPress,
}: {
  tournament: Tournament;
  onPress: () => void;
}) {
  const slotsLeft =
    tournament.maxEntries > 0
      ? tournament.maxEntries - tournament.entryCount
      : null;
  const status: { label: string; tone: 'open' | 'warn' | 'muted' } =
    tournament.isRegistrationOpen
      ? slotsLeft !== null && slotsLeft > 0 && slotsLeft <= 3
        ? { label: `${slotsLeft} left`, tone: 'warn' }
        : { label: 'Open', tone: 'open' }
      : tournament.status === 'IN_PROGRESS'
      ? { label: 'Live', tone: 'warn' }
      : { label: tournament.status.replaceAll('_', ' '), tone: 'muted' };

  return (
    <PressableScale
      style={styles.gameRow}
      scaleTo={0.985}
      onPress={onPress}
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
}

/** Half-width tournament card; shows remaining slots instead of a countdown. */
function TournamentGridCard({
  tournament,
  onPress,
}: {
  tournament: Tournament;
  onPress: () => void;
}) {
  const fee =
    tournament.paymentPolicy === 'FREE'
      ? 'Free'
      : formatMoney(tournament.totalFeeMinor, tournament.currency);
  const slotsLeft =
    tournament.maxEntries > 0
      ? tournament.maxEntries - tournament.entryCount
      : null;
  const almostFull = slotsLeft !== null && slotsLeft > 0 && slotsLeft <= 3;

  return (
    <GridCard
      accent={ACCENT}
      imageUrl={tournament.imageUrl}
      fallback="tournament"
      tag={tournament.sport?.name ?? tournament.format.replaceAll('_', ' ')}
      status={
        almostFull
          ? { label: `${slotsLeft} slots left`, tone: 'warn' }
          : tournament.isRegistrationOpen
          ? { label: 'Open', tone: 'good' }
          : undefined
      }
      title={tournament.title}
      subtitle={formatDateTime(
        tournament.startsAt,
        tournament.venue?.timeZone || undefined,
      )}
      place={
        [tournament.venue?.name, tournament.venue?.city]
          .filter(Boolean)
          .join(', ') || 'Venue TBA'
      }
      priceLabel={tournament.paymentPolicy === 'FREE' ? undefined : 'AT VENUE'}
      price={fee}
      onPress={onPress}
    />
  );
}

/** Mirrors the half-width grid card so nothing shifts when results land. */
function ListSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton height={108} radius={0} />
      <View style={styles.skeletonBody}>
        <Skeleton height={13} width="80%" radius={theme.borderRadius.xs} />
        <Skeleton height={11} width="55%" radius={theme.borderRadius.xs} />
        <Skeleton height={11} width="65%" radius={theme.borderRadius.xs} />
      </View>
    </View>
  );
}

function matchesDate(startsAt: string, filter: DateFilter) {
  if (filter === 'All dates') return true;
  const date = new Date(startsAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (filter === 'Today') return date.toDateString() === today.toDateString();
  if (filter === 'Tomorrow')
    return date.toDateString() === tomorrow.toDateString();
  return [0, 6].includes(date.getDay());
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: theme.spacing.s,
  },

  title: { ...theme.typography.h1 },
  subtitle: {
    ...theme.typography.bodySmall,
    marginTop: 5,
    marginBottom: theme.spacing.l,
  },

  segments: {
    flexDirection: 'row',
    height: 52,
    padding: 5,
    gap: 5,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.m,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: theme.borderRadius.m,
  },
  segmentActive: {
    backgroundColor: ACCENT.muted,
    borderWidth: 1,
    borderColor: ACCENT.soft,
  },
  segmentText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontFamily: theme.font.semibold,
    fontSize: 13,
  },
  segmentTextActive: { color: ACCENT.base, fontFamily: theme.font.bold },

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
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.font.regular,
    fontSize: 15,
    padding: 0,
  },

  chips: { gap: theme.spacing.s, paddingVertical: theme.spacing.s },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  resultTitle: { ...theme.typography.h3, flexShrink: 1 },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: theme.spacing.s,
  },
  clearText: {
    ...theme.typography.caption,
    color: ACCENT.base,
    fontFamily: theme.font.bold,
  },

  list: { gap: theme.spacing.m },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.m },
  blockHeading: {
    ...theme.typography.h3,
    fontSize: 17,
    marginBottom: theme.spacing.m,
  },

  featured: {
    height: 260,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  featuredTop: {
    position: 'absolute',
    top: theme.spacing.m,
    left: theme.spacing.m,
  },
  featuredFlag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: ACCENT.base,
  },
  featuredFlagText: {
    ...theme.typography.caption,
    fontSize: 10,
    color: ACCENT.on,
    fontFamily: theme.font.extrabold,
    letterSpacing: 0.6,
  },
  featuredBody: { padding: theme.spacing.m },
  featuredTitle: { ...theme.typography.h3, fontSize: 21 },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: theme.spacing.s,
  },
  featuredMetaText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    flexShrink: 1,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    marginTop: theme.spacing.m,
  },
  featuredEntrants: { flexShrink: 1 },
  featuredCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredCountText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontFamily: theme.font.semibold,
  },
  featuredCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primary,
  },
  featuredCtaText: { ...theme.typography.button, fontSize: 14 },

  gameList: { gap: theme.spacing.s },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gameThumb: {
    width: 54,
    height: 54,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surfaceLight,
  },
  gameCopy: { flex: 1, minWidth: 0, gap: 2 },
  gameTitle: { ...theme.typography.title, fontSize: 14 },
  gameSport: {
    ...theme.typography.caption,
    fontSize: 11,
    letterSpacing: 0.6,
    color: theme.colors.textMuted,
  },
  gameWhen: { ...theme.typography.caption, fontSize: 11 },
  gamePill: {
    maxWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.surfaceLight,
  },
  gamePillOpen: { backgroundColor: theme.colors.primaryMuted },
  gamePillWarn: { backgroundColor: ACCENT.muted },
  gamePillText: {
    ...theme.typography.caption,
    fontSize: 11,
    fontFamily: theme.font.bold,
    color: theme.colors.textSecondary,
  },
  gamePillTextOpen: { color: theme.colors.primary },
  gamePillTextWarn: { color: ACCENT.base },
  skeletonCard: {
    flex: 1,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skeletonBody: { padding: theme.spacing.s, gap: 6 },
  gridCell: { width: '47%', flexGrow: 1 },
  columnWrapper: { gap: theme.spacing.m, marginBottom: theme.spacing.m },

  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: theme.spacing.m,
  },
  inlineErrorText: { ...theme.typography.caption, color: theme.colors.warning },
});
