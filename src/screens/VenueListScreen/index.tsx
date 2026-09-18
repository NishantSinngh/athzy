import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BackendAPI } from '../../api/backend';
import { prefetchImages } from '../../components/AppImage';
import { EmptyState } from '../../components/EmptyState';
import { RefreshBar } from '../../components/RefreshBar';
import { ScreenHeader } from '../../components/ScreenHeader';
import { theme } from '../../theme';

import { styles, ACCENT } from './styles';
import { VenueGridCard, ListSkeleton } from './components/VenueCards';
import { VenueSearchHeader } from './components/VenueSearchHeader';

export const VenueListScreen = ({ navigation, route }: any) => {
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
      prefetchImages(
        (data.venues || []).slice(0, 8).map((venue: any) => venue.imageUrl),
      );
    } catch (requestError: any) {
      setError(requestError.message || 'Venues could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () =>
      venues.filter(venue => {
        const haystack = `${venue.name} ${venue.city} ${(
          venue.sports || []
        ).join(' ')}`.toLowerCase();
        const matchesQuery = haystack.includes(query.trim().toLowerCase());
        const matchesFilter =
          filter === 'All' ||
          (venue.sports || []).includes(filter.toLowerCase());
        return matchesQuery && matchesFilter;
      }),
    [filter, query, venues],
  );

  const submitSearch = useCallback(() => {
    const value = query.trim();
    if (!value) return;
    setRecentSearches(current =>
      [value, ...current.filter(item => item !== value)].slice(0, 5),
    );
    setSearching(false);
  }, [query]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const clearFilters = useCallback(() => {
    setFilter('All');
    setQuery('');
  }, []);

  const listData = useMemo(() => {
    if (searching) return [];
    if (loading) return [0, 1, 2, 3];
    return visible;
  }, [loading, searching, visible]);

  const handleVenuePress = useCallback(
    (id: string) => {
      navigation.navigate('VenueDetails', { venueId: id });
    },
    [navigation],
  );

  const handleRefresh = useCallback(() => load(true), [load]);
  const handleRetry = useCallback(() => load(false), [load]);

  const renderItem = useCallback(
    ({ item, index }: any) => {
      if (loading) return <ListSkeleton />;

      return (
        <Animated.View
          style={styles.gridCell}
          entering={FadeInDown.delay(
            Math.min(index, 8) * theme.motion.stagger,
          ).duration(theme.motion.duration.normal)}
        >
          <VenueGridCard venue={item} onPress={handleVenuePress} />
        </Animated.View>
      );
    },
    [loading, handleVenuePress],
  );

  const keyExtractor = useCallback(
    (item: any, index: number) => (loading ? String(index) : item.id),
    [loading],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RefreshBar active={refreshing} accent={ACCENT} />
      <ScreenHeader
        navigation={navigation}
        title={searching ? 'Search venues' : 'Venues'}
        subtitle={
          searching ? undefined : 'Book courts, pitches and grounds near you'
        }
        showBack={!isTabRoot}
      />

      <FlatList
        key={`venues-list-${searching}-${loading}`}
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={searching ? 1 : 2}
        columnWrapperStyle={!searching ? styles.columnWrapper : undefined}
        contentContainerStyle={[
          styles.content,
          isTabRoot && { paddingBottom: insets.bottom + 110 },
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
          <VenueSearchHeader
            query={query}
            setQuery={setQuery}
            searching={searching}
            setSearching={setSearching}
            submitSearch={submitSearch}
            recentSearches={recentSearches}
            clearRecentSearches={clearRecentSearches}
            filter={filter}
            setFilter={setFilter}
            visibleVenues={visible}
            onVenuePress={handleVenuePress}
          />
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
                onAction={handleRetry}
              />
            ) : !visible.length ? (
              <EmptyState
                icon="business-outline"
                title="No venues found"
                message="Try another sport or search term."
                actionLabel={
                  filter !== 'All' || query ? 'Clear filters' : undefined
                }
                onAction={clearFilters}
              />
            ) : null
          ) : null
        }
      />
    </SafeAreaView>
  );
};
