import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BackendAPI } from '../../api/backend';
import { prefetchImages } from '../../components/AppImage';
import { EmptyState } from '../../components/EmptyState';
import { PressableScale, triggerHaptic } from '../../components/PressableScale';
import { RefreshBar } from '../../components/RefreshBar';
import { theme } from '../../theme';
import type { Tournament } from '../../types/tournament';

import { styles, ACCENT, DiscoverTab, DateFilter } from './styles';
import { DiscoverHeader } from './components/DiscoverHeader';
import {
  EventGridCard,
  UpcomingGameRow,
  FeaturedTournament,
  ListSkeleton,
} from './components/DiscoverCards';

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

  const clearFilters = useCallback(() => {
    triggerHaptic('medium');
    setQuery('');
    setSport('All sports');
    setDateFilter('All dates');
  }, []);

  const listData = useMemo(() => {
    if (loading) return [0, 1, 2, 3];
    if (tab === 'EVENTS') return visible;
    return upcoming;
  }, [loading, tab, visible, upcoming]);

  // Stable navigation callbacks mapped to item IDs
  const handleEventPress = useCallback(
    (id: string) => navigation.navigate('EventDetails', { eventId: id }),
    [navigation],
  );
  const handleTournamentPress = useCallback(
    (id: string) =>
      navigation.navigate('TournamentDetails', { tournamentId: id }),
    [navigation],
  );
  const handleRefresh = useCallback(() => load(true), [load]);
  const handleRetry = useCallback(() => load(false), [load]);

  const renderItem = useCallback(
    ({ item, index }: any) => {
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
            <EventGridCard event={item} onPress={handleEventPress} />
          </Animated.View>
        );
      }

      return (
        <Animated.View
          entering={FadeInDown.delay(
            Math.min(index, 8) * theme.motion.stagger,
          ).duration(theme.motion.duration.normal)}
        >
          <UpcomingGameRow tournament={item} onPress={handleTournamentPress} />
        </Animated.View>
      );
    },
    [loading, tab, handleEventPress, handleTournamentPress],
  );

  const keyExtractor = useCallback(
    (item: any, index: number) => (loading ? String(index) : item.id),
    [loading],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshBar active={refreshing} accent={ACCENT} />
      <FlatList
        key={`discover-list-${tab}-${loading}`}
        data={listData}
        keyExtractor={keyExtractor}
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
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        ListHeaderComponent={
          <>
            <DiscoverHeader
              tab={tab}
              setTab={setTab}
              query={query}
              setQuery={setQuery}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              sport={sport}
              setSport={setSport}
              sports={sports}
              filtersActive={filtersActive}
              clearFilters={clearFilters}
            />

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
                  onPress={handleTournamentPress}
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
                onAction={handleRetry}
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
              onPress={handleRetry}
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
